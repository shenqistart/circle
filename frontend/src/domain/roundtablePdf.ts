import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import type { ModeratorSummary, RoundtableResult } from "./types";
import { reportFileName } from "./roundtableReport";

const summarySections: Array<[keyof ModeratorSummary, string]> = [
  ["consensus", "共识"],
  ["disagreements", "分歧"],
  ["insights", "洞察"],
  ["actions", "行动"]
];

const formatDateTime = (date: Date): string =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

const listContent = (items: string[]): Content =>
  items.length > 0
    ? { ul: items.map((item) => item.trim()).filter(Boolean), margin: [0, 4, 0, 0] }
    : { text: "暂无", color: "#8a94a6", margin: [0, 4, 0, 0] };

const summaryCard = (label: string, items: string[]): Content => ({
  stack: [{ text: label, style: "summaryLabel" }, listContent(items)],
  margin: [8, 8, 8, 8]
});

const turnCard = (expertName: string, content: string): Content => ({
  table: {
    widths: ["*"],
    body: [
      [
        {
          stack: [
            { text: expertName, style: "turnSpeaker" },
            { text: content || "暂无内容", style: "turnContent" }
          ],
          margin: [10, 8, 10, 8]
        }
      ]
    ]
  },
  layout: {
    hLineColor: () => "#d9dee8",
    vLineColor: () => "#d9dee8",
    hLineWidth: () => 0.7,
    vLineWidth: () => 0.7
  },
  margin: [0, 0, 0, 8]
});

export const pdfReportFileName = (result: RoundtableResult): string => reportFileName(result).replace(/\.md$/, ".pdf");

export const buildRoundtablePdfDefinition = (
  result: RoundtableResult,
  generatedAt = new Date()
): TDocumentDefinitions => {
  const summaryRows: Content[][] = [
    summarySections.slice(0, 2).map(([key, label]) => summaryCard(label, result.moderatorSummary[key])),
    summarySections.slice(2).map(([key, label]) => summaryCard(label, result.moderatorSummary[key]))
  ];

  const roundContent: Content[] = result.rounds.flatMap((round) => [
    { text: round.title, style: "roundTitle" },
    ...round.turns.map((turn) => turnCard(turn.expertName, turn.content))
  ]);

  return {
    pageSize: "A4",
    pageMargins: [46, 52, 46, 56],
    info: {
      title: "AI 圆桌报告",
      author: "Circle",
      subject: result.question
    },
    defaultStyle: {
      font: "NotoSansSC",
      fontSize: 10.5,
      lineHeight: 1.35,
      color: "#1f2937"
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: "Circle AI Roundtable", color: "#8a94a6", fontSize: 8 },
        { text: `${currentPage} / ${pageCount}`, alignment: "right", color: "#8a94a6", fontSize: 8 }
      ],
      margin: [46, 0]
    }),
    styles: {
      eyebrow: { color: "#2f8f75", fontSize: 9, bold: true, characterSpacing: 0.8 },
      title: { fontSize: 26, bold: true, color: "#111827", margin: [0, 4, 0, 14] },
      question: { fontSize: 14, bold: true, color: "#111827", lineHeight: 1.35 },
      meta: { color: "#6b7280", fontSize: 9 },
      metricValue: { fontSize: 18, bold: true, color: "#111827" },
      metricLabel: { fontSize: 8.5, color: "#6b7280" },
      sectionTitle: { fontSize: 15, bold: true, color: "#111827", margin: [0, 18, 0, 8] },
      summaryLabel: { fontSize: 11, bold: true, color: "#0f766e" },
      tableHeader: { bold: true, color: "#374151", fillColor: "#eef2f7" },
      roundTitle: { fontSize: 13, bold: true, color: "#111827", margin: [0, 10, 0, 8] },
      turnSpeaker: { bold: true, color: "#111827", margin: [0, 0, 0, 4] },
      turnContent: { color: "#374151" }
    },
    content: [
      {
        columns: [
          { text: "CIRCLE ROUNDTABLE REPORT", style: "eyebrow" },
          { text: formatDateTime(generatedAt), alignment: "right", style: "meta" }
        ]
      },
      { text: "AI 圆桌报告", style: "title" },
      {
        table: {
          widths: ["*"],
          body: [[{ text: result.question, style: "question", margin: [14, 12, 14, 12] }]]
        },
        layout: {
          hLineColor: () => "#b7ead9",
          vLineColor: () => "#b7ead9",
          hLineWidth: () => 0.9,
          vLineWidth: () => 0.9,
          fillColor: () => "#f2fbf7"
        },
        margin: [0, 0, 0, 14]
      },
      {
        columns: [
          { stack: [{ text: `${result.experts.length}`, style: "metricValue" }, { text: "参会专家", style: "metricLabel" }] },
          { stack: [{ text: `${result.rounds.length}`, style: "metricValue" }, { text: "讨论轮次", style: "metricLabel" }] },
          {
            stack: [
              {
                text: `${summarySections.reduce((count, [key]) => count + result.moderatorSummary[key].length, 0)}`,
                style: "metricValue"
              },
              { text: "总结条目", style: "metricLabel" }
            ]
          }
        ],
        columnGap: 12,
        margin: [0, 0, 0, 8]
      },
      { text: "主持人总结", style: "sectionTitle" },
      {
        table: {
          widths: ["*", "*"],
          body: summaryRows
        },
        layout: {
          hLineColor: () => "#e3e8f0",
          vLineColor: () => "#e3e8f0",
          hLineWidth: () => 0.7,
          vLineWidth: () => 0.7,
          fillColor: () => "#fbfcfe"
        }
      },
      { text: "专家阵容", style: "sectionTitle" },
      {
        table: {
          headerRows: 1,
          widths: [110, "*"],
          body: [
            [
              { text: "专家", style: "tableHeader", margin: [6, 5, 6, 5] },
              { text: "关注点", style: "tableHeader", margin: [6, 5, 6, 5] }
            ],
            ...result.experts.map((expert) => [
              { text: expert.name, bold: true, margin: [6, 6, 6, 6] },
              { text: expert.shortDescription, margin: [6, 6, 6, 6] }
            ])
          ]
        },
        layout: "lightHorizontalLines"
      },
      { text: "讨论记录", style: "sectionTitle", pageBreak: "before" },
      ...roundContent
    ]
  };
};
