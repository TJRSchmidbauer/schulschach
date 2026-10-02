'use client';

import { useState } from 'react';
import CertificateEditor from '@/components/CertificateEditor';

type Option = { alias: string; text: string };

export default function TrainerCertificate({ students }: { students: Option[] }) {
  const [alias, setAlias] = useState(students[0]?.alias ?? '');
  const current = students.find((s) => s.alias === alias);

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <label htmlFor="cert-alias">Alias</label>
        <select
          id="cert-alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          style={{
            textTransform: 'none',
            letterSpacing: 'normal',
            padding: '0.55rem 0.75rem',
            border: '2px solid #ddd3c3',
            borderRadius: 10,
            fontSize: '1rem',
            background: '#fdfbf7',
          }}
        >
          {students.map((s) => (
            <option key={s.alias} value={s.alias}>{s.alias}</option>
          ))}
        </select>
      </div>
      <CertificateEditor achievementDefault={current?.text ?? ''} resetKey={alias} />
    </div>
  );
}
