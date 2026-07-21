import type { FontFamilyFile } from '../types/domain'

// `slug` is not unique within a family: the same font can appear as a `manual`
// formula with no archive assets AND e.g. a `google` one that has them. Code
// that selects a face by slug alone can land on the empty record, whose
// bare-slug coverage/woff paths then 404. Among candidates, prefer one that
// actually carries data (a coverage_file or a woff path); keep the first when
// none does, so a genuinely asset-less family still yields a file.
export function pickFileWithData(
  candidates: FontFamilyFile[],
): FontFamilyFile | undefined {
  return candidates.find((f) => f.coverage_file || f.path) ?? candidates[0]
}
