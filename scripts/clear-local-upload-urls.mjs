/**
 * One-time maintenance: clears legacy local file URLs that 404 in dev/production
 * (/uploads/... or http://localhost.../uploads/...) so teachers re-upload via Cloudinary.
 *
 * Run: npm run db:clear-local-upload-urls
 * Requires MONGODB_URI (loads .env.local if present).
 */
import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  readFileSync(p, 'utf8').split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  });
}

function isBrokenLocalUploadRef(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  if (!t) return false;
  if (t.startsWith('/uploads/')) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\//i.test(t);
}

function cleanUrl(s) {
  if (typeof s !== 'string') return s;
  return isBrokenLocalUploadRef(s) ? '' : s;
}

function cleanAttachments(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter(
    (x) => typeof x === 'string' && x.trim() && !isBrokenLocalUploadRef(x)
  );
}

async function main() {
  loadEnvLocal();
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Add it to .env.local or the environment.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  let touched = 0;

  const courseCol = db.collection('courses');
  const courses = await courseCol.find({}).toArray();
  for (const c of courses) {
    const $set = {};
    if (isBrokenLocalUploadRef(c.image)) {
      $set.image = '';
      touched++;
    }
    if (isBrokenLocalUploadRef(c.syllabusUrl)) {
      $set.syllabusUrl = '';
      touched++;
    }
    if (Array.isArray(c.syllabusMaterials)) {
      let changed = false;
      const newMats = c.syllabusMaterials.map((m) => {
        if (!m || typeof m !== 'object') return m;
        const url = cleanUrl(m.url);
        if (url !== m.url) changed = true;
        return { ...m, url };
      });
      if (changed) {
        $set.syllabusMaterials = newMats;
        touched++;
      }
    }
    if (Object.keys($set).length) {
      await courseCol.updateOne({ _id: c._id }, { $set });
    }
  }

  const lessonCol = db.collection('lessons');
  const lessons = await lessonCol.find({}).toArray();
  for (const l of lessons) {
    const $set = {};
    if (isBrokenLocalUploadRef(l.fileUrl)) {
      $set.fileUrl = '';
      touched++;
    }
    if (isBrokenLocalUploadRef(l.youtubeUrl)) {
      $set.youtubeUrl = '';
      touched++;
    }
    if (l.video && typeof l.video === 'object') {
      const prev = l.video.url;
      const next = cleanUrl(prev);
      if (next !== prev) {
        if (!next) {
          $set.video = null;
        } else {
          $set.video = { ...l.video, url: next };
        }
        touched++;
      }
    }
    if (Array.isArray(l.files)) {
      let changed = false;
      const newFiles = l.files.map((f) => {
        if (!f || typeof f !== 'object') return f;
        const fileUrl = cleanUrl(f.fileUrl);
        if (fileUrl !== f.fileUrl) changed = true;
        return { ...f, fileUrl };
      });
      if (changed) {
        $set.files = newFiles;
        touched++;
      }
    }
    if (Object.keys($set).length) {
      await lessonCol.updateOne({ _id: l._id }, { $set });
    }
  }

  const assignmentCol = db.collection('assignments');
  const assignments = await assignmentCol.find({}).toArray();
  for (const a of assignments) {
    const $set = {};
    const att = cleanAttachments(a.attachments);
    if (JSON.stringify(att) !== JSON.stringify(a.attachments)) {
      $set.attachments = att;
      touched++;
    }
    if (isBrokenLocalUploadRef(a.url)) {
      $set.url = '';
      touched++;
    }
    if (Object.keys($set).length) {
      await assignmentCol.updateOne({ _id: a._id }, { $set });
    }
  }

  const submissionCol = db.collection('submissions');
  const submissions = await submissionCol.find({}).toArray();
  for (const s of submissions) {
    const $set = {};
    const att = cleanAttachments(s.attachments);
    if (JSON.stringify(att) !== JSON.stringify(s.attachments)) {
      $set.attachments = att;
      touched++;
    }
    if (isBrokenLocalUploadRef(s.content)) {
      $set.content = '';
      touched++;
    }
    if (Object.keys($set).length) {
      await submissionCol.updateOne({ _id: s._id }, { $set });
    }
  }

  const userCol = db.collection('users');
  const users = await userCol.find({}).toArray();
  for (const u of users) {
    if (isBrokenLocalUploadRef(u.imageUrl)) {
      await userCol.updateOne({ _id: u._id }, { $set: { imageUrl: '' } });
      touched++;
    }
  }

  await mongoose.disconnect();
  console.log(
    `Done. Updated documents / fields with broken /uploads references (approx. ${touched} field fixes). Re-upload assets via Cloudinary where needed.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
