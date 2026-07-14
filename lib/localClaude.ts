// SERVER-ONLY: spawns the local Claude Code CLI in headless mode (`claude -p`).
// Used as the AI provider when no ANTHROPIC_API_KEY is set.
// Requires the Claude Code CLI installed and logged in on this machine.
// NOTE: works with `npm run dev` / `npm start` on your machine or a VPS -
// it can NOT work on Vercel serverless (no CLI binary there).
import "server-only";
import { spawn } from "node:child_process";

const TIMEOUT_MS = 180_000;

/**
 * Which model alias to pass to the CLI.
 * Configurable because available models differ by plan:
 *   CLAUDE_CLI_MODEL=sonnet   -> force one alias for every call
 *   CLAUDE_CLI_MODEL=default  -> omit --model entirely; the CLI uses
 *                                whatever model your session defaults to
 * Unset: sonnet for generation, haiku for scoring.
 */
function cliModelArgs(apiModel: string): string[] {
  const override = process.env.CLAUDE_CLI_MODEL?.trim();
  if (override === "default") return [];
  if (override) return ["--model", override];
  if (apiModel.includes("haiku")) return ["--model", "haiku"];
  return ["--model", "sonnet"];
}

export function runLocalClaude(
  system: string,
  user: string,
  model: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p", // headless / print mode: one prompt in, response out, exit
      "--output-format",
      "text",
      "--system-prompt",
      system,
      ...cliModelArgs(model),
    ];

    const child = spawn("claude", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Local Claude CLI timed out after 180s"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));

    child.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      if (e.code === "ENOENT") {
        reject(
          new Error(
            "Claude Code CLI not found. Install it (npm install -g @anthropic-ai/claude-code), run `claude` once to log in, or set ANTHROPIC_API_KEY instead."
          )
        );
      } else {
        reject(e);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(out.trim());
      } else {
        const detail = (err || out).slice(0, 300);
        const hint = /model/i.test(detail)
          ? " If this is a model-availability error, set CLAUDE_CLI_MODEL=default in .env.local to use your CLI's default model."
          : "";
        reject(new Error(`Claude CLI exited with code ${code}: ${detail}${hint}`));
      }
    });

    child.stdin.write(user);
    child.stdin.end();
  });
}
