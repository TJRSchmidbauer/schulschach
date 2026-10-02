import Link from 'next/link';

const items = [
  { key: 'students', href: '/trainer/dashboard', label: 'Schüler' },
  { key: 'puzzles', href: '/trainer/puzzles', label: 'Übungen' },
  { key: 'assignments', href: '/trainer/assignments', label: 'Hausaufgaben' },
  { key: 'certificates', href: '/trainer/certificates', label: 'Urkunden' },
] as const;

export default function TrainerNav({ active }: { active: 'students' | 'puzzles' | 'assignments' | 'certificates' }) {
  return (
    <nav style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: 999,
            textDecoration: 'none',
            fontWeight: 600,
            background: i.key === active ? '#2f7d5c' : '#e7dfd0',
            color: i.key === active ? '#ffffff' : '#26221c',
          }}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
