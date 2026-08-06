/**
 * Seed 15 Creative Team tasks created by Chide (LM), assigned across roster,
 * with unique briefs/dates and PNG reference images uploaded to R2.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-creative-tasks.mjs
 */

import { randomUUID, createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const CHIDE_ID = "d97da50f-8fc1-4e47-9ced-e4c514742065";
const CREATIVE_TEAM_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const CREATIVE_WORKSPACE_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

/** Team members to receive work (not Chide as sole owner). */
const MEMBERS = [
  {
    id: "f60ba23a-3243-42ec-bd49-3d5a65468f43",
    nestId: "VFX3",
    name: "Aanu Fajemiluyi",
  },
  {
    id: "0c36f176-cc43-4ed4-aec3-9b0db58d41ae",
    nestId: "VFX5",
    name: "Abdullahi Precious",
  },
  {
    id: "eca2c442-b532-4b00-b8ce-4be5f14fbbcd",
    nestId: "VFX6",
    name: "fakorede kehinde",
  },
  {
    id: "24ead1c9-3869-4c23-9b91-ba9a03e5084a",
    nestId: "VFX4",
    name: "osita praise",
  },
  {
    id: "5bbb2b6a-fcc5-4808-bd03-0829278ec4ed",
    nestId: "VFX2",
    name: "Tolu Kolade",
  },
  {
    id: "883edf0b-4418-4a39-a13e-f4dd8dd27033",
    nestId: "GFX2",
    name: "Daniel Samuel",
  },
];

const STATUSES = [
  "backlog",
  "todo",
  "todo",
  "in_progress",
  "in_progress",
  "blocked",
  "review",
  "todo",
  "in_progress",
  "review",
  "todo",
  "backlog",
  "in_progress",
  "todo",
  "blocked",
];

const PRIORITIES = [
  "medium",
  "high",
  "urgent",
  "medium",
  "high",
  "low",
  "medium",
  "high",
  "urgent",
  "medium",
  "low",
  "medium",
  "high",
  "medium",
  "high",
];

/** Unique creative briefs (Africa / NestbyEden flavour). */
const TASKS = [
  {
    title: "Nest Hero billboard: Lekki Phase 1 tower",
    description:
      "Deliver a 10×20ft print-ready billboard for the Lekki landmark campaign.\n\nDeliverables:\n- Final PSD + flattened TIFF (CMYK 300dpi)\n- Safe-zone mockup on Lagos street plate\n- Logo lockup in daylight and dusk variants\n\nBrief notes: Sunset warmth, NestByEden orange #FF6300 accent, no stock-style people collages.",
    dueOffsetDays: 3,
    tags: ["outdoor", "print"],
    checklist: [
      "Lock headline copy with marketing",
      "Export CMYK TIFF for printer",
      "Upload mockup PDF for Chide review",
    ],
  },
  {
    title: "Instagram carousel: Waterfront duplex open day",
    description:
      "8-slide IG carousel for the waterfront duplex weekend open day.\n\nDeliverables:\n- 8 square PNGs (1080×1080)\n- Cover story highlight sticker pack (3 assets)\n- Caption pack (ENG) under 2,200 chars for slides 1 / 4 / 8\n\nTone: warm premium, not luxury cliché.",
    dueOffsetDays: 5,
    tags: ["social", "carousel"],
    checklist: [
      "Select 6 hero stills from drive",
      "Slide order and CTA last slide",
      "Export PNG zip",
    ],
  },
  {
    title: "YouTube thumbnail set: Nest site walkthrough",
    description:
      "Design 5 click-safe thumbnails for the site walkthrough series.\n\nDeliverables:\n- 5 × 1280×720 JPG\n- Alternate text-heavy and photo-led variants for A/B\n- Brand frame template for future episodes",
    dueOffsetDays: 7,
    tags: ["youtube", "thumbnail"],
    checklist: [
      "Pull 10 stills from walkthrough",
      "Type hierarchy check at 200px width",
      "Export JPG set",
    ],
  },
  {
    title: "Email masthead: August investor digest",
    description:
      "Build the masthead and in-email hero for the August investor digest.\n\nDeliverables:\n- 600px-wide header PNG (retina ×2)\n- Dark and light theme options\n- Alt text + hex colour notes for Resend template",
    dueOffsetDays: 4,
    tags: ["email", "brand"],
    checklist: [
      "Align with Nest type system",
      "Export both themes",
      "Share hex + safe padding",
    ],
  },
  {
    title: "Story reel covers: 7 days of site activity",
    description:
      "Daily IG/TikTok story covers for a week-long site vlog series.\n\nDeliverables:\n- 7 vertical covers 1080×1920\n- Consistent date badge and Nest mark\n- Motion-safe safe zones marked in Figma",
    dueOffsetDays: 6,
    tags: ["stories", "social"],
    checklist: [
      "Figma component for date badge",
      "Export day 1–7 PNGs",
      "Handoff notes for editor",
    ],
  },
  {
    title: "Sales brochure cover: Pearl Court villa pack",
    description:
      "Print cover and inside-spread opener for Pearl Court 12-page brochure.\n\nDeliverables:\n- Cover (A4 bleed) PDF + layered AI/PSD\n- Inside hero spread (pages 2–3)\n- Printer-ready package with fonts outlined\n\nBlocked until brand receives updated site plan.",
    dueOffsetDays: 10,
    tags: ["print", "brochure"],
    checklist: [
      "Bleed and crop marks set",
      "Font license check",
      "Printer package zip",
    ],
    blockedReason: "Waiting on updated architectural site plan from project team.",
  },
  {
    title: "LinkedIn banners: recruitment creative team",
    description:
      "Personal and company LinkedIn banners for Creative Team hiring push.\n\nDeliverables:\n- Company page banner 1128×191\n- 3 personal cover options 1584×396\n- Export pack with color specs",
    dueOffsetDays: 8,
    tags: ["linkedin", "hr-asset"],
    checklist: [
      "Draft concepts with Chide",
      "Final export",
      "Upload to brand kit",
    ],
  },
  {
    title: "3D still styleframe: lobby feature wall",
    description:
      "Produce still styleframes for the lobby feature wall brand installation.\n\nDeliverables:\n- 3 styleframes 4K PNG\n- Lighting and material notes\n- Optional short turntable GIF (under 4MB)",
    dueOffsetDays: 12,
    tags: ["3d", "interior"],
    checklist: [
      "Block base geometry",
      "Material pass",
      "Final styleframes",
    ],
  },
  {
    title: "WhatsApp broadcast graphics: price drop flash",
    description:
      "Clean broadcast pack for sales agents’ WhatsApp lists.\n\nDeliverables:\n- 4 message-ready images 1080×1080\n- 1 vertical 1080×1920\n- Copy-safe versions without phone numbers",
    dueOffsetDays: 2,
    tags: ["whatsapp", "sales"],
    checklist: [
      "Get approved pricing from sales",
      "Export both ratios",
      "QA on dark mode preview",
    ],
  },
  {
    title: "Launch poster: Nest Community Saturday",
    description:
      "Event poster for Nest Community Saturday at the showroom.\n\nDeliverables:\n- A2 print PDF\n- Social crop 4:5\n- Digital screen version 1920×1080",
    dueOffsetDays: 9,
    tags: ["event", "poster"],
    checklist: [
      "Confirm speakers and time",
      "Lock design",
      "Print + digital export",
    ],
  },
  {
    title: "UI mock: virtual tour CTA sheet for web",
    description:
      "Design a lightweight CTA sheet component for virtual tour entry on nestbyeden.com.\n\nDeliverables:\n- Desktop and mobile PNG mocks\n- Figma component with variants\n- Asset export (button states, icon)",
    dueOffsetDays: 11,
    tags: ["ui", "web"],
    checklist: [
      "Wireframe with product",
      "Hi-fi passes",
      "Hand-off notes",
    ],
  },
  {
    title: "Before/after collage: interior staging",
    description:
      "Side-by-side staging reveal for two units completed this month.\n\nDeliverables:\n- 2 main collages 1600×900\n- Stories cut-downs\n- Caption draft highlighting Craft + Nest",
    dueOffsetDays: 5,
    tags: ["staging", "collage"],
    checklist: [
      "Source before plates",
      "Color-match plates",
      "Export set",
    ],
  },
  {
    title: "Icon set: NestFlow internal status badges",
    description:
      "Create a 12-icon line + filled set aligned to NestFlow statuses for internal decks.\n\nDeliverables:\n- SVG set (12)\n- PNG 128px sheet\n- Usage note for brand deck",
    dueOffsetDays: 14,
    tags: ["iconography", "product"],
    checklist: [
      "Grid and stroke weight",
      "SVG export clean",
      "Sheet for brand kit",
    ],
  },
  {
    title: "Landing hero motion stills: road-to-key story",
    description:
      "Six sequential stills for a short hero motion teaser (handoff to motion editor).\n\nDeliverables:\n- 6 stills 1920×1080\n- Rough animatic PDF\n- Notes on frame timing (total 12s)",
    dueOffsetDays: 13,
    tags: ["motion", "hero"],
    checklist: [
      "Storyboard lock",
      "Render stills",
      "Brief motion editor",
    ],
  },
  {
    title: "Press kit cover: NestByEden Q3 media",
    description:
      "Press kit cover and divider pages for Q3 media outreach.\n\nDeliverables:\n- Cover + 3 dividers (PDF)\n- JPG previews for PR email\n- Editable source file\n\nBlocked on final PR quote from leadership.",
    dueOffsetDays: 15,
    tags: ["press", "pdf"],
    checklist: [
      "Layout grid",
      "Quote space reserved",
      "Export preview pack",
    ],
    blockedReason: "Waiting on leadership PR quote for cover pull-quote.",
  },
];

function requireEnv() {
  const keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
  ];
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

/** Unique solid-colour PNG with a simple stripe (valid R2 image test files). */
function makePng(seed, width = 640, height = 400) {
  // Deterministic RGB from seed
  const hash = createHash("sha256").update(String(seed)).digest();
  const r = hash[0];
  const g = hash[1];
  const b = hash[2];
  const r2 = hash[3];
  const g2 = hash[4];
  const b2 = hash[5];

  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    raw[row] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 3;
      const band = Math.floor(x / 40) % 2 === 0 || Math.floor(y / 40) % 2 === 0;
      if (band) {
        raw[i] = r;
        raw[i + 1] = g;
        raw[i + 2] = b;
      } else {
        raw[i] = r2;
        raw[i + 1] = g2;
        raw[i + 2] = b2;
      }
    }
  }

  const signature = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = deflateSync(raw);
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function buildObjectKey(taskId, attachmentId, fileName) {
  const safeName = fileName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return `tasks/${taskId}/${attachmentId}/${safeName || "file"}`;
}

function dueIso(offsetDays) {
  const d = new Date();
  d.setUTCHours(15, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString();
}

function pickAssignees(index) {
  const primary = MEMBERS[index % MEMBERS.length];
  const secondary = MEMBERS[(index + 2) % MEMBERS.length];
  // Every third task gets two assignees
  if (index % 3 === 0 && primary.id !== secondary.id) {
    return [primary, secondary];
  }
  return [primary];
}

async function main() {
  requireEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;
  const bucket = process.env.R2_BUCKET || "nestflow-attachments";

  const r2 = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  // Ensure Creative Team workspace exists (general kind, creative team_id).
  const { error: workspaceError } = await supabase
    .schema("nestflow")
    .from("workspaces")
    .upsert(
      {
        id: CREATIVE_WORKSPACE_ID,
        team_id: CREATIVE_TEAM_ID,
        name: "Creative Team",
        kind: "general",
        is_archived: false,
      },
      { onConflict: "id" },
    );

  if (workspaceError) {
    // Public view path fallback
    const { error: viewError } = await supabase.from("nf_workspaces").upsert(
      {
        id: CREATIVE_WORKSPACE_ID,
        team_id: CREATIVE_TEAM_ID,
        name: "Creative Team",
        kind: "general",
        is_archived: false,
      },
      { onConflict: "id" },
    );
    if (viewError) {
      throw new Error(`workspace: ${workspaceError.message} / ${viewError.message}`);
    }
  }

  console.log("Creative Team workspace ready:", CREATIVE_WORKSPACE_ID);

  const created = [];

  for (let i = 0; i < TASKS.length; i++) {
    const brief = TASKS[i];
    const taskId = randomUUID();
    const status = STATUSES[i];
    const priority = PRIORITIES[i];
    const assignees = pickAssignees(i);
    const dueAt = dueIso(brief.dueOffsetDays);
    const now = new Date().toISOString();
    const blockedReason =
      status === "blocked"
        ? brief.blockedReason || "Waiting on inputs from stakeholders."
        : null;

    const { error: taskError } = await supabase.from("nf_tasks").insert({
      id: taskId,
      workspace_id: CREATIVE_WORKSPACE_ID,
      title: brief.title,
      description: brief.description,
      status,
      priority,
      due_at: dueAt,
      blocked_reason: blockedReason,
      created_by: CHIDE_ID,
      created_at: now,
      updated_at: now,
    });

    if (taskError) {
      throw new Error(`task ${i + 1}: ${taskError.message}`);
    }

    const { error: assignError } = await supabase.from("nf_task_assignees").insert(
      assignees.map((person) => ({
        task_id: taskId,
        user_id: person.id,
        assigned_by: CHIDE_ID,
      })),
    );
    if (assignError) {
      throw new Error(`assignees ${i + 1}: ${assignError.message}`);
    }

    // Tags via workspace tags if table allows
    for (const tagName of brief.tags) {
      const { data: tagRow } = await supabase
        .from("nf_tags")
        .upsert(
          {
            workspace_id: CREATIVE_WORKSPACE_ID,
            name: tagName,
          },
          { onConflict: "workspace_id,name" },
        )
        .select("id")
        .maybeSingle();

      if (tagRow?.id) {
        await supabase.from("nf_task_tags").upsert(
          { task_id: taskId, tag_id: tagRow.id },
          { onConflict: "task_id,tag_id" },
        );
      }
    }

    for (let c = 0; c < brief.checklist.length; c++) {
      await supabase.from("nf_checklist_items").insert({
        task_id: taskId,
        title: brief.checklist[c],
        is_done: false,
        position: c,
        created_by: CHIDE_ID,
      });
    }

    await supabase.from("nf_activity_events").insert({
      task_id: taskId,
      actor_id: CHIDE_ID,
      event_type: "task_created",
      summary: `Chide created “${brief.title}”`,
      metadata: { seed: true, seedBatch: "creative-15" },
    });

    // Two PNG references for R2 testing: brief board + mood plate
    for (const plate of ["brief-board", "mood-plate"]) {
      const attachmentId = randomUUID();
      const fileName = `${plate}-${String(i + 1).padStart(2, "0")}.png`;
      const objectKey = buildObjectKey(taskId, attachmentId, fileName);
      const png = makePng(`${taskId}-${plate}`, 720, 480);

      await r2.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: png,
          ContentType: "image/png",
        }),
      );

      const { error: attError } = await supabase.from("nf_attachments").insert({
        id: attachmentId,
        task_id: taskId,
        uploaded_by: CHIDE_ID,
        object_key: objectKey,
        file_name: fileName,
        mime_type: "image/png",
        size_bytes: png.length,
      });
      if (attError) {
        throw new Error(`attachment ${i + 1}: ${attError.message}`);
      }

      await supabase.from("nf_activity_events").insert({
        task_id: taskId,
        actor_id: CHIDE_ID,
        event_type: "attachment_added",
        summary: `Attached “${fileName}”`,
        metadata: { attachmentId, seed: true },
      });
    }

    created.push({
      n: i + 1,
      taskId,
      title: brief.title,
      status,
      priority,
      dueAt: dueAt.slice(0, 10),
      assignees: assignees.map((a) => a.nestId).join("+"),
    });

    console.log(
      `✓ ${String(i + 1).padStart(2, "0")} ${brief.title} → ${assignees
        .map((a) => a.nestId)
        .join(", ")} · ${status} · due ${dueAt.slice(0, 10)}`,
    );
  }

  console.log("\nSeeded", created.length, "creative tasks with 2 PNG attachments each.");
  console.log("Workspace:", CREATIVE_WORKSPACE_ID);
  console.log("Created by: Chide (CHIDE)");
  console.log("Open a task in NestFlow and use attachment download to verify R2.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
