import type { ChoiceRef } from "../apply/committee";
import {
  isCtoExecutiveAssistant,
  isDevelopmentCommittee,
  officerFirstChoiceShowsGithub,
  officerFirstChoiceShowsPortfolio,
} from "../apply/committee";
import { escapeHtmlForEmail } from "./template-kit";

export function officerFirstChoiceLinkExtras(input: {
  firstChoice: ChoiceRef;
  portfolioUrl: string | null | undefined;
  githubUrl: string | null | undefined;
}): { textLines: string; htmlRows: string } {
  const text: string[] = [];
  const html: string[] = [];
  const portfolio = input.portfolioUrl?.trim() ?? "";
  const github = input.githubUrl?.trim() ?? "";

  if (officerFirstChoiceShowsPortfolio(input.firstChoice) && portfolio) {
    text.push(`Portfolio: ${portfolio}`);
    html.push(
      `<p style="margin:0 0 12px;"><strong>Portfolio</strong><br><a href="${escapeHtmlForEmail(portfolio)}">${escapeHtmlForEmail(portfolio)}</a></p>`,
    );
  }
  if (officerFirstChoiceShowsGithub(input.firstChoice) && github) {
    text.push(`GitHub: ${github}`);
    html.push(
      `<p style="margin:0 0 12px;"><strong>GitHub</strong><br><a href="${escapeHtmlForEmail(github)}">${escapeHtmlForEmail(github)}</a></p>`,
    );
  }

  return {
    textLines: text.length ? `${text.join("\n")}\n` : "",
    htmlRows: html.join(""),
  };
}

export function devExamParagraphs(choices: ChoiceRef[]): {
  text: string;
  html: string;
} {
  const lines: string[] = [];
  const htmlParts: string[] = [];
  const hasDev = choices.some((choice) => isDevelopmentCommittee(choice.committee));
  const hasCtoEa = choices.some((choice) => isCtoExecutiveAssistant(choice.title));

  if (hasDev) {
    lines.push(
      "Because you applied to the Development Committee, you will undergo a special exam. The exam specifications are attached below.",
    );
    htmlParts.push(
      `<p style="margin:0 0 16px;">Because you applied to the <strong>Development Committee</strong>, you will undergo a special exam. The exam specifications are attached below.</p>`,
    );
  }
  if (hasCtoEa) {
    lines.push(
      "Because you applied as the Executive Assistant to the CTO, you will undergo a special exam. The exam specifications are attached below.",
    );
    htmlParts.push(
      `<p style="margin:0 0 16px;">Because you applied as the <strong>Executive Assistant to the CTO</strong>, you will undergo a special exam. The exam specifications are attached below.</p>`,
    );
  }

  return {
    text: lines.length ? `\n\n${lines.join("\n\n")}\n` : "",
    html: htmlParts.join(""),
  };
}
