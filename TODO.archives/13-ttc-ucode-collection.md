# 13 — TTC: wire `ucode audit collection` per face

## Why

For `.ttc`/`.otc`/`.dfong` font collections, the archive-private builder
needs **one coverage tree per face**, named by PostScript name. ucode exposes
two CLI commands for this:

| Command | Behavior |
|---|---|
| `ucode audit font PATH` | Single face. If given a TTC, audits ALL faces into one shared tree. |
| `ucode audit collection PATH --font-index N` | One face of a TTC/OTC/dfong, identified by face index. |

The old code used `audit font` for every entry. For TTCs this produced one
tree containing whichever face ucode picked as the "primary" — every other
face was silently dropped. Worse, `find_face_output_dir` returns `nil` when
`font_audit/` has multiple children, so for any multi-face TTC the builder
silently skipped coverage aggregation entirely.

## Fix

### 13.1 — Assign `font_index` per face in `build_font_manifest`

`fontist_archive_private/builder.rb#build_font_manifest` now tracks an
incrementing per-TTC index. Each `font_collections[].fonts[].styles[]` entry
in the manifest carries a `font_index`:

```ruby
(yaml["font_collections"] || []).each do |collection|
  ttc_file = collection["filename"]
  next_index = 0
  (collection["fonts"] || []).each do |family|
    (family["styles"] || []).each do |style|
      declared_index = style["font_index"]
      idx = declared_index.nil? ? next_index : declared_index.to_i
      next_index = idx + 1 if declared_index.nil?
      manifest << {
        ...,
        source: :collection,
        ttc_filename: ttc_file,
        font_index: idx,
      }
    end
  end
end
```

If a formula YAML declares `font_index` explicitly on a style, that wins.
Otherwise, faces are indexed in declaration order within their collection.
This matches the convention fontist itself uses when extracting TTCs.

### 13.2 — Branch the audit invocation on source type

In the per-face audit loop, the command depends on `matched[:source]`:

```ruby
args = if m[:source] == :collection
         ["bundle", "exec", "ucode", "audit", "collection", face_path,
          "--font-index", (m[:font_index] || 0).to_s,
          "--label", ps,
          "--output", ucode_out]
       else
         ["bundle", "exec", "ucode", "audit", "font", face_path,
          "--output", ucode_out]
       end
```

`--label <PSName>` forces the per-face subtree directory to match the
PostScript name, so downstream `preserve_ucode_directory` +
`aggregate_coverage` (which key off the YAML-declared PSName) find the right
output.

### 13.3 — WOFF conversion: unchanged

The `fontisan ConvertCommand` invocation still passes the TTC path directly.
fontisan internally iterates faces and writes one WOFF per face — wait, it
doesn't: it writes the **first** face by default. That's a separate problem
(fontisan's TTC WOFF conversion) tracked as a follow-up below. For now,
coverage is correct per face; WOFF specimen for non-first TTC faces may be
the first face's glyphs labeled as another face.

## Files touched

| File | Change |
|---|---|
| `fontist-archive-private/lib/fontist_archive_private/builder.rb` | track per-TTC `font_index`; branch audit invocation on `:source` |

## Acceptance

- [x] `build_font_manifest` assigns `font_index` to every `:collection` entry
- [x] Builder invokes `ucode audit collection --font-index N --label PSName`
      for collection sources; `ucode audit font` for standalone
- [x] `ruby -c builder.rb` syntax-checks clean
- [ ] (CI validation) Inter.ttc formula produces one coverage file per face
      (`coverage/manual/inter/Inter-Bold.json`, `Inter-BoldItalic.json`, ...)
- [ ] (Follow-up) fontisan WOFF conversion per TTC face — see "Out of scope"

## Out of scope

- **fontisan TTC WOFF conversion.** `Fontisan::Commands::ConvertCommand`
  currently writes one WOFF per TTC file (first face only). Per-face WOFF
  specimens require either:
  - A fontisan API change to accept `font_index:` (preferred — symmetric with
    ucode), or
  - A pre-split step that extracts face N to a temporary `.otf` before
    conversion.
  Neither is in scope here. Tracked as follow-up; coverage data is already
  correct without it.

- **Cycling through unknown TTC face count.** Current code trusts the YAML
  manifest to enumerate every face. If the YAML misses a face, that face is
  silently not audited. This is the right default (YAML is source of truth)
  but worth flagging.
