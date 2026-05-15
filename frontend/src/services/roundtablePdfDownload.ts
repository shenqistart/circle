import notoSansBoldUrl from "../assets/fonts/noto-sans-sc-chinese-simplified-700-normal.ttf?url";
import notoSansRegularUrl from "../assets/fonts/noto-sans-sc-chinese-simplified-400-normal.ttf?url";
import type { TFontDictionary } from "pdfmake/interfaces";
import type { RoundtableResult } from "../domain/types";
import { buildRoundtablePdfDefinition, pdfReportFileName } from "../domain/roundtablePdf";

const absoluteAssetUrl = (assetUrl: string): string => new URL(assetUrl, window.location.href).href;

const reportFonts = (): TFontDictionary => ({
  NotoSansSC: {
    normal: absoluteAssetUrl(notoSansRegularUrl),
    bold: absoluteAssetUrl(notoSansBoldUrl),
    italics: absoluteAssetUrl(notoSansRegularUrl),
    bolditalics: absoluteAssetUrl(notoSansBoldUrl)
  }
});

export const downloadRoundtablePdf = async (result: RoundtableResult): Promise<void> => {
  const pdfMake = await import("pdfmake/build/pdfmake");
  const documentDefinition = buildRoundtablePdfDefinition(result);
  pdfMake.addFonts(reportFonts());
  await pdfMake.createPdf(documentDefinition).download(pdfReportFileName(result));
};
