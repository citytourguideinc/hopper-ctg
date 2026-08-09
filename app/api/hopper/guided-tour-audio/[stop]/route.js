export const runtime = 'nodejs';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { validGuidedTourSession } from '@/lib/guidedTourAuth';

const FILES = {
  roundabout: 'roundabout.mp3',
  'the-pointe': 'the-pointe.mp3',
  'convention-center': 'convention-center.mp3',
  'marriott-hotels': 'marriott-hotels.mp3',
  'fort-brooke-park': 'fort-brooke-park.mp3',
  'history-center': 'history-center.mp3',
  'amalie-arena': 'amalie-arena.mp3',
  'water-street-phase-1': 'water-street-phase-1.mp3',
  'sparkman-wharf': 'sparkman-wharf.mp3'
};

export async function GET(request, { params }) {
  const store = await cookies();
  const token = store.get('ctg_guided_tour_auth')?.value;

  if (!validGuidedTourSession(token)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const resolved = await params;
  const filename = FILES[resolved.stop];

  if (!filename) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const filepath = path.join(
      process.cwd(),
      'private',
      'guided-tour-audio',
      filename
    );

    const file = await readFile(filepath);
    const range = request.headers.get('range');

    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);

      if (match) {
        const start = Number(match[1]);
        const end = match[2]
          ? Number(match[2])
          : file.length - 1;

        const chunk = file.subarray(start, end + 1);

        return new Response(chunk, {
          status: 206,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': String(chunk.length),
            'Content-Range':
              `bytes ${start}-${end}/${file.length}`,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, no-store'
          }
        });
      }
    }

    return new Response(file, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(file.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store'
      }
    });

  } catch {
    return new Response(
      'Audio unavailable',
      { status: 404 }
    );
  }
}




