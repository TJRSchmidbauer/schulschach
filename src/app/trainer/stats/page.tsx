import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { themeLabel } from '@/lib/themes';
import { avg, byTheme, pct, totals, weakest, type StatRow, type ThemeStat } from '@/lib/stats';
import TrainerNav from '@/app/trainer/TrainerNav';

function rateColor(rate: number): string {
  if (rate >= 70) return '#245f46';
  if (rate < 40) return '#b34747';
  return '#6b5618';
}

function ThemeTable({ stats }: { stats: ThemeStat[] }) {
  const sorted = [...stats].sort((a, b) => b.attempts - a.attempts);
  if (sorted.length === 0) return <p className="muted">Noch keine Daten.</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="results">
        <thead>
          <tr>
            <th>Thema</th><th>Versuche</th><th>Selbstständig</th><th>Mit Tipp</th><th>Lösung gesehen</th><th>Ø Fehlversuche</th><th>Ø Sekunden</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => {
            const rate = pct(s.independent, s.attempts);
            return (
              <tr key={s.theme}>
                <td><b>{themeLabel(s.theme)}</b></td>
                <td>{s.attempts}</td>
                <td style={{ color: rateColor(rate), fontWeight: 700 }}>{rate} %</td>
                <td>{pct(s.withHint, s.attempts)} %</td>
                <td>{pct(s.viewed, s.attempts)} %</td>
                <td>{avg(s.wrong, s.attempts)}</td>
                <td>{Math.round(s.seconds / s.attempts)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Weak({ stats, min }: { stats: ThemeStat[]; min: number }) {
  const w = weakest(stats, min, 5);
  if (w.length === 0) return <p className="muted">Keine auffälligen Schwachstellen (mindestens {min} Versuche pro Thema nötig).</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
      {w.map((s) => (
        <li key={s.theme}>
          <b>{themeLabel(s.theme)}</b>: nur {pct(s.independent, s.attempts)} % selbstständig gelöst ({s.attempts} Versuche)
        </li>
      ))}
    </ul>
  );
}

export default async function TrainerStats({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const sp = await searchParams;

  const students = await db.user.findMany({
    where: { role: 'STUDENT', active: true },
    orderBy: { alias: 'asc' },
    select: { id: true, alias: true },
  });
  const attempts = await db.attempt.findMany({
    where: { user: { role: 'STUDENT', active: true } },
    select: {
      userId: true,
      result: true,
      wrongAttempts: true,
      durationSeconds: true,
      puzzle: { select: { themes: true } },
    },
  });
  const rows: StatRow[] = attempts.map((a) => ({
    userId: a.userId,
    result: a.result,
    wrongAttempts: a.wrongAttempts,
    durationSeconds: a.durationSeconds,
    themes: a.puzzle.themes,
  }));

  const selected = students.find((s) => s.id === sp.s) ?? null;
  const allThemes = byTheme(rows);
  const mine = selected ? rows.filter((r) => r.userId === selected.id) : [];
  const mineThemes = byTheme(mine);
  const mineTotals = totals(mine);

  const field: React.CSSProperties = {
    textTransform: 'none',
    letterSpacing: 'normal',
    padding: '0.5rem 0.7rem',
    border: '2px solid #ddd3c3',
    borderRadius: 10,
    fontSize: '0.95rem',
    background: '#fdfbf7',
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Statistik</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Wo klappt es, wo hakt es? Die Werte beziehen sich auf alle Versuche. „Selbstständig“ heißt: gelöst ohne Tipp und ohne Fehlversuch.
        </p>
      </div>
      <TrainerNav active="stats" />

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Einzelne Schülerin / einzelner Schüler</h2>
        <form method="get" style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <label htmlFor="s">Alias</label>
            <select id="s" name="s" defaultValue={selected?.id ?? ''} style={field}>
              <option value="">bitte wählen</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.alias}</option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }}>Anzeigen</button>
        </form>
        {selected && (
          <div style={{ marginTop: '1rem' }}>
            <p>
              <b>{selected.alias}</b>: {mineTotals.attempts} Versuche, {pct(mineTotals.independent, mineTotals.attempts)} % selbstständig, {pct(mineTotals.withHint, mineTotals.attempts)} % mit Tipp, {pct(mineTotals.viewed, mineTotals.attempts)} % Lösung gesehen
            </p>
            <h3 style={{ marginBottom: '0.3rem' }}>Schwachstellen</h3>
            <Weak stats={mineThemes} min={3} />
            <h3 style={{ margin: '1rem 0 0.3rem' }}>Alle Themen</h3>
            <ThemeTable stats={mineThemes} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Übersicht je Schüler</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="results">
            <thead>
              <tr><th>Alias</th><th>Versuche</th><th>Selbstständig</th><th>Mit Tipp</th><th>Lösung gesehen</th><th>Ø Fehlversuche</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((st) => {
                const t = totals(rows.filter((r) => r.userId === st.id));
                return (
                  <tr key={st.id}>
                    <td><b>{st.alias}</b></td>
                    <td>{t.attempts}</td>
                    <td>{pct(t.independent, t.attempts)} %</td>
                    <td>{pct(t.withHint, t.attempts)} %</td>
                    <td>{pct(t.viewed, t.attempts)} %</td>
                    <td>{avg(t.wrong, t.attempts)}</td>
                    <td><Link href={`/trainer/stats?s=${st.id}`}>Details</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Schwachstellen der ganzen AG</h2>
        <Weak stats={allThemes} min={5} />
      </div>

      <div className="card">
        <h2>Alle Themen (ganze AG)</h2>
        <ThemeTable stats={allThemes} />
      </div>
    </div>
  );
}
