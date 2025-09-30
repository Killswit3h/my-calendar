"use client";

import React, { useEffect, useState } from 'react';
import { buildEmployeePayload, parseEmployeePayload } from '@/lib/dragAssign';

export default function DragAssignDebug() {
  const [results, setResults] = useState<string[]>([]);
  useEffect(() => {
    const out: string[] = [];
    const id = 'john-doe';
    const name = 'John Doe';
    const raw = buildEmployeePayload(id, name);
    const parsed = parseEmployeePayload(raw);
    out.push(`marshal: ${raw.includes('john-doe') ? 'ok' : 'fail'}`);
    out.push(`unmarshal: ${parsed && parsed.id === id && parsed.name === name ? 'ok' : 'fail'}`);

    // assignment dedupe check (client-side idea)
    const current = ['a', 'b', 'c'];
    const next = Array.from(new Set([...current, 'b']));
    out.push(`dedupe: ${next.length === 3 && next.includes('b') ? 'ok' : 'fail'}`);
    setResults(out);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Drag Assign Debug</h3>
      <ul>
        {results.map((r, i) => (<li key={i}>{r}</li>))}
      </ul>
      <p>Open console during real DnD to observe payloads.</p>
    </div>
  );
}

