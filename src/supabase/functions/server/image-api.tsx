import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2";

export const imageApi = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const BUCKET_NAME = "make-f1a393b4-debate-images";

// Initialize storage bucket on first request
let bucketInitialized = false;

async function ensureBucketExists() {
  if (bucketInitialized) return;

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5242880, // 5MB limit
      });

      if (error) {
        console.error("Error creating bucket:", error);
        throw error;
      }
    }

    bucketInitialized = true;
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
    throw error;
  }
}

// Upload debate image
imageApi.post("/make-server-f1a393b4/upload-debate-image", async (c) => {
  try {
    await ensureBucketExists();

    const formData = await c.req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return c.json({ error: "No image file provided" }, 400);
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return c.json({ error: "File must be an image" }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomUUID();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `debate_${timestamp}_${randomId}.${extension}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return c.json({ error: "Failed to upload image" }, 500);
    }

    // Create signed URL (valid for 10 years)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filename, 315360000); // 10 years in seconds

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      return c.json({ error: "Failed to create image URL" }, 500);
    }

    return c.json({
      success: true,
      imageUrl: urlData.signedUrl,
      filename: filename,
    });
  } catch (error) {
    console.error("Error uploading debate image:", error);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});
