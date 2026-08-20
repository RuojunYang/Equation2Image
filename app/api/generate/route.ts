import Replicate from "replicate";
import { NextRequest, NextResponse } from "next/server";

const MODEL =
  "jagilley/controlnet-scribble:435061a1b5a4c1e2674041605daf786909f466146c68bd6830d7344335ca412";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, prompt } = await req.json();

    if (!imageBase64 || !prompt) {
      return NextResponse.json(
        { error: "imageBase64 and prompt are required" },
        { status: 400 }
      );
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          error:
            "REPLICATE_API_TOKEN is not configured. Add it to .env.local to enable AI generation.",
        },
        { status: 503 }
      );
    }

    const replicate = new Replicate({ auth: token });

    const output = (await replicate.run(MODEL, {
      input: {
        image: imageBase64,
        prompt,
        num_inference_steps: 30,
        guidance_scale: 9,
        controlnet_conditioning_scale: 0.9,
      },
    })) as string[];

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "No image returned from model" }, { status: 502 });
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
