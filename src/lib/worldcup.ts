// src/lib/worldcup.ts
// Data layer for World Cup 2026 – consumes openfootball JSON
// All display text is translated to Spanish via mapping tables.

import { supabase } from './supabase';

export const DATA_URL =
  'https://cqexjtuffyqgfxthvjhp.supabase.co/storage/v1/object/public/mundial/worldcup2026.json';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Score {
  ft?: [number, number];  // full-time / tiempo completo
  et?: [number, number];  // extra-time / tiempo extra
  p?:  [number, number];  // penalties / penales
}

export interface Goal {
  name: string;
  minute?: number;
}

export interface Match {
  id?: string;            // UUID de base de datos
  round: string;
  num?: number;
  date: string;          // "2026-06-11T19:00:00.000Z" (nuevo) o "2026-06-11" (antiguo)
  time?: string;         // "13:00 UTC-6" (antiguo), opcional ahora
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: Score;
  goals?: { team1?: Goal[]; team2?: Goal[] };
  estado?: 'programado' | 'en_curso' | 'finalizado';
  minuto_actual?: number;
  hora_inicio_periodo?: string | null;
  cronometro_corriendo?: boolean;
  tiempo_adicional?: number;
  penales_team1?: number | null;
  penales_team2?: number | null;
  periodo_actual?: string | null;
}

export interface MatchEvent {
  id: string;
  partido_id: string;
  tipo: 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'falta' | 'cambio' | 'penal_anotado' | 'penal_fallado';
  minuto: number;
  jugador: string;
  equipo_id: string;
  detalle?: string;
  created_at: string;
}

export interface WorldCupData {
  name: string;
  matches: Match[];
}

export interface TeamStanding {
  team: string;
  teamEs: string;
  flagCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface GroupStanding {
  group: string;
  groupEs: string;
  teams: TeamStanding[];
}


// ──────────────────────────────────────────────
// TRADUCCIÓN: Países / Selecciones
// ──────────────────────────────────────────────

export const TEAM_ES: Record<string, string> = {
  'ALG': 'Argelia',
  'ARG': 'Argentina',
  'AUS': 'Australia',
  'AUT': 'Austria',
  'BEL': 'Bélgica',
  'BIH': 'Bosnia y Herzegovina',
  'BRA': 'Brasil',
  'CAN': 'Canadá',
  'CIV': 'Costa de Marfil',
  'COD': 'Rep. Dem. del Congo',
  'COL': 'Colombia',
  'CPV': 'Cabo Verde',
  'CRO': 'Croacia',
  'CUR': 'Curazao',
  'CZE': 'República Checa',
  'ECU': 'Ecuador',
  'EGY': 'Egipto',
  'ENG': 'Inglaterra',
  'ESP': 'España',
  'FRA': 'Francia',
  'GER': 'Alemania',
  'GHA': 'Ghana',
  'HAI': 'Haití',
  'IRN': 'Irán',
  'IRQ': 'Irak',
  'JOR': 'Jordania',
  'JPN': 'Japón',
  'KOR': 'Corea del Sur',
  'KSA': 'Arabia Saudita',
  'MAR': 'Marruecos',
  'MEX': 'México',
  'NED': 'Países Bajos',
  'NOR': 'Noruega',
  'NZL': 'Nueva Zelanda',
  'PAN': 'Panamá',
  'PAR': 'Paraguay',
  'POR': 'Portugal',
  'QAT': 'Catar',
  'RSA': 'Sudáfrica',
  'SCO': 'Escocia',
  'SEN': 'Senegal',
  'SUI': 'Suiza',
  'SWE': 'Suecia',
  'TUN': 'Túnez',
  'TUR': 'Turquía',
  'URU': 'Uruguay',
  'USA': 'EE. UU.',
  'UZB': 'Uzbekistán',
};

/** Devuelve el nombre del equipo en español, o traduce marcadores de posición (W/L) */
export function translateTeam(name: string): string {
  // Traducción directa de país
  if (TEAM_ES[name]) return TEAM_ES[name];

  // Marcadores de fase eliminatoria (ej: "Winner Match 73" -> "Ganador 73")
  if (/^Winner\s+(?:Match\s+)?(\d+)$/i.test(name)) {
    return name.replace(/^Winner\s+(?:Match\s+)?(\d+)$/i, 'Ganador $1');
  }
  if (/^Loser\s+(?:Match\s+)?(\d+)$/i.test(name)) {
    return name.replace(/^Loser\s+(?:Match\s+)?(\d+)$/i, 'Perdedor $1');
  }

  // Formato corto (ej: "W73" -> "G73", "L73" o "RU101" -> "P101")
  if (/^W(\d+)$/i.test(name)) {
    return name.replace(/^W(\d+)$/i, 'G$1');
  }
  if (/^L(\d+)$/i.test(name)) {
    return name.replace(/^L(\d+)$/i, 'P$1');
  }
  if (/^RU(\d+)$/i.test(name)) {
    return name.replace(/^RU(\d+)$/i, 'P$1');
  }

  // Otros casos (ej: "1A", "2B") se quedan igual
  return name;
}

// ──────────────────────────────────────────────
// TRADUCCIÓN: Ciudades / Sedes
// ──────────────────────────────────────────────

export const GROUND_ES: Record<string, string> = {};

/** Devuelve el nombre de la sede en español. */
export function translateGround(ground: string): string {
  return ground;
}

// ──────────────────────────────────────────────
// TRADUCCIÓN: Rondas / Fases
// ──────────────────────────────────────────────

export const ROUND_ES: Record<string, string> = {};

/** Devuelve el nombre de la ronda en español. */
export function translateRound(round: string): string {
  return round;
}

// ──────────────────────────────────────────────
// TRADUCCIÓN: Grupos
// ──────────────────────────────────────────────

export const GROUP_ES: Record<string, string> = {};

/** Devuelve el nombre del grupo en español. */
export function translateGroup(group: string): string {
  return group;
}

// ──────────────────────────────────────────────
// Country → ISO flag code mapping
// ──────────────────────────────────────────────

const FLAG_CODES: Record<string, string> = {
  'ALG': 'dz', 'ARG': 'ar', 'AUS': 'au', 'AUT': 'at', 'BEL': 'be', 'BIH': 'ba',
  'BRA': 'br', 'CAN': 'ca', 'CIV': 'ci', 'COD': 'cd', 'COL': 'co', 'CPV': 'cv',
  'CRO': 'hr', 'CUR': 'cw', 'CZE': 'cz', 'ECU': 'ec', 'EGY': 'eg', 'ENG': 'gb-eng',
  'ESP': 'es', 'FRA': 'fr', 'GER': 'de', 'GHA': 'gh', 'HAI': 'ht', 'IRN': 'ir',
  'IRQ': 'iq', 'JOR': 'jo', 'JPN': 'jp', 'KOR': 'kr', 'KSA': 'sa', 'MAR': 'ma',
  'MEX': 'mx', 'NED': 'nl', 'NOR': 'no', 'NZL': 'nz', 'PAN': 'pa', 'PAR': 'py',
  'POR': 'pt', 'QAT': 'qa', 'RSA': 'za', 'SCO': 'gb-sct', 'SEN': 'sn', 'SUI': 'ch',
  'SWE': 'se', 'TUN': 'tn', 'TUR': 'tr', 'URU': 'uy', 'USA': 'us', 'UZB': 'uz',
};

export function getFlagUrl(team: string): string {
  // Si no es un código FIFA de exactamente 3 letras (ej. "RU101", "W99", "1A"), es un placeholder
  if (!/^[A-Z]{3}$/.test(team)) {
    return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // píxel transparente
  }
  const code = FLAG_CODES[team] ?? team.toLowerCase().substring(0, 2);
  return `https://flagcdn.com/${code}.svg`;
}

// ──────────────────────────────────────────────
// Time utilities
// ──────────────────────────────────────────────

/**
 * Parsea a un objeto Date. Si timeStr no existe, asume que dateStr es un ISO 8601 UTC.
 * Si timeStr existe, asume que viene en Eastern Time (EDT, UTC-4 en verano), dado "2026-06-11".
 */
export function parseMatchDate(dateStr: string, timeStr?: string): Date {
  if (!timeStr) {
    return new Date(dateStr);
  }

  const [hStr, mStr] = timeStr.split(':');
  if (!hStr || !mStr) return new Date(`${dateStr}T12:00:00Z`);

  const etHour = parseInt(hStr, 10);
  const min  = parseInt(mStr, 10);

  // Eastern Daylight Time (EDT) es UTC-4 en verano (junio/julio)
  const utcHour = etHour + 4;

  return new Date(Date.UTC(
    parseInt(dateStr.slice(0, 4), 10),
    parseInt(dateStr.slice(5, 7), 10) - 1,
    parseInt(dateStr.slice(8, 10), 10),
    utcHour,
    min
  ));
}

// ──────────────────────────────────────────────
// Data fetching
// ──────────────────────────────────────────────

let _cache: WorldCupData | null = null;

export async function fetchWorldCupData(): Promise<WorldCupData> {
  if (_cache) return _cache;
  try {
    const { data: dbMatches, error } = await supabase
      .from('partidos')
      .select('*, sedes(*)');
    
    if (error) throw error;
    
    // Sort matches by numero_partido
    dbMatches.sort((a, b) => a.numero_partido - b.numero_partido);

    const matches: Match[] = dbMatches.map(m => {
      let score: Score | undefined = undefined;
      if (m.estado === 'finalizado' || m.estado === 'en_curso') {
        score = {
          ft: [m.goles_team1, m.goles_team2]
        };
        if (m.penales_team1 !== null && m.penales_team2 !== null) {
          score.p = [m.penales_team1, m.penales_team2];
        }
      }

      return {
        id: m.id,
        num: m.numero_partido,
        round: m.ronda,
        group: m.grupo || undefined,
        date: m.fecha_inicio_utc, // ISO string in UTC
        time: undefined,          // Omitted since date is full ISO datetime
        team1: m.team1_id,
        team2: m.team2_id,
        ground: m.sedes ? m.sedes.ciudad_en : (m.sede_id || 'Sede no definida'),
        score: score,
        estado: m.estado,
        minuto_actual: m.minuto_actual,
        hora_inicio_periodo: m.hora_inicio_periodo,
        cronometro_corriendo: m.cronometro_corriendo,
        tiempo_adicional: m.tiempo_adicional,
        penales_team1: m.penales_team1,
        penales_team2: m.penales_team2,
        periodo_actual: m.periodo_actual
      };
    });

    _cache = { name: 'World Cup 2026', matches };
    return _cache;
  } catch (e) {
    console.error('[WorldCup] Error al obtener datos de Supabase:', e);
    return { name: 'World Cup 2026', matches: [] };
  }
}

export async function fetchMatchEvents(matchId: string): Promise<MatchEvent[]> {
  try {
    const { data, error } = await supabase
      .from('eventos_partido')
      .select('*')
      .eq('partido_id', matchId)
      .order('minuto', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as MatchEvent[];
  } catch (e) {
    console.error(`[WorldCup] Error al obtener eventos del partido ${matchId}:`, e);
    return [];
  }
}


// ──────────────────────────────────────────────
// Derived helpers
// ──────────────────────────────────────────────

export function getGroupMatches(data: WorldCupData): Match[] {
  return data.matches.filter(m => Boolean(m.group));
}

export function getKnockoutMatches(data: WorldCupData): Match[] {
  return data.matches.filter(m => !m.group);
}

export function getNextMatch(data: WorldCupData, _now = new Date()): Match | null {
  // 1. Si hay algún partido actualmente en curso, mostrarlo como prioridad en el Hero.
  const liveMatch = data.matches.find(m => m.estado === 'en_curso');
  if (liveMatch) return liveMatch;

  // 2. Buscar el primer partido que no haya finalizado, ordenado cronológicamente.
  const nonFinalized = data.matches
    .filter(m => m.estado !== 'finalizado')
    .map(m => ({ m, d: parseMatchDate(m.date, m.time) }))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  if (nonFinalized.length > 0) {
    return nonFinalized[0].m;
  }

  // 3. Si todos los partidos han terminado, devolver null.
  return null;
}

export function getMatchesForDate(data: WorldCupData, dateStr: string): Match[] {
  return data.matches.filter(m => {
    const d = parseMatchDate(m.date, m.time);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return local === dateStr;
  });
}

export function getRounds(data: WorldCupData): string[] {
  const seen   = new Set<string>();
  const result: string[] = [];
  for (const m of data.matches) {
    if (!seen.has(m.round)) { seen.add(m.round); result.push(m.round); }
  }
  return result;
}

export function getMatchesByRound(data: WorldCupData): Map<string, Match[]> {
  const map = new Map<string, Match[]>();
  for (const m of data.matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  }
  return map;
}

export function getMatchesByGroup(data: WorldCupData): Map<string, Match[]> {
  const map = new Map<string, Match[]>();
  for (const m of getGroupMatches(data)) {
    const g = m.group!;
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(m);
  }
  return map;
}

/**
 * Devuelve todos los partidos ordenados cronológicamente, agrupados por
 * fecha UTC (clave: "YYYY-MM-DD"). El Map está ordenado por fecha.
 */
export interface DayGroup {
  dateKey: string;       // "2026-06-11"
  utcDate: Date;         // primer kickoff del día (para el header)
  matches: Match[];      // partidos del día ordenados por hora
}

export function getMatchesByDateChronological(data: WorldCupData): DayGroup[] {
  // 1. Ordenar todos los partidos por timestamp UTC
  const sorted = [...data.matches].sort((a, b) => {
    const da = parseMatchDate(a.date, a.time).getTime();
    const db = parseMatchDate(b.date, b.time).getTime();
    return da - db;
  });

  // 2. Agrupar por fecha UTC (YYYY-MM-DD del timestamp UTC)
  const map = new Map<string, Match[]>();
  for (const m of sorted) {
    const d   = parseMatchDate(m.date, m.time);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }

  // 3. Convertir a array de DayGroup (ya ordenado por inserción)
  return Array.from(map.entries()).map(([dateKey, matches]) => ({
    dateKey,
    utcDate: parseMatchDate(matches[0].date, matches[0].time),
    matches,
  }));
}

// ──────────────────────────────────────────────
// Standings calculation
// ──────────────────────────────────────────────

function initTeam(team: string): TeamStanding {
  return {
    team,
    teamEs: translateTeam(team),
    flagCode: FLAG_CODES[team] ?? 'xx',
    played: 0, won: 0, drawn: 0, lost: 0,
    gf: 0, ga: 0, gd: 0, points: 0,
  };
}

export function calculateGroupStandings(data: WorldCupData): GroupStanding[] {
  const matchesByGroup = getMatchesByGroup(data);
  const standings: GroupStanding[] = [];

  for (const [group, matches] of matchesByGroup) {
    const teamMap = new Map<string, TeamStanding>();
    const getOrCreate = (name: string) => {
      if (!teamMap.has(name)) teamMap.set(name, initTeam(name));
      return teamMap.get(name)!;
    };

    for (const match of matches) {
      const t1 = getOrCreate(match.team1);
      const t2 = getOrCreate(match.team2);

      if (match.score?.ft) {
        const [g1, g2] = match.score.ft;
        t1.played++; t2.played++;
        t1.gf += g1; t1.ga += g2; t1.gd = t1.gf - t1.ga;
        t2.gf += g2; t2.ga += g1; t2.gd = t2.gf - t2.ga;

        if (g1 > g2) {
          t1.won++; t1.points += 3; t2.lost++;
        } else if (g1 < g2) {
          t2.won++; t2.points += 3; t1.lost++;
        } else {
          t1.drawn++; t1.points++;
          t2.drawn++; t2.points++;
        }
      }
    }

    const teams = Array.from(teamMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    standings.push({ group, groupEs: translateGroup(group), teams });
  }

  return standings.sort((a, b) => a.group.localeCompare(b.group));
}

// ──────────────────────────────────────────────
// Venue data (con ciudades y países en español)
// ──────────────────────────────────────────────

export interface Venue {
  name: string;       // nombre oficial del estadio
  cityEn: string;     // clave original del JSON
  cityEs: string;     // nombre de ciudad en español
  countryEn: string;
  countryEs: string;
  capacity: string;
  imageKey: string;
}

export const VENUES: Venue[] = [
  { name: 'Estadio Azteca',          cityEn: 'Ciudad de México',                          cityEs: 'Ciudad de México',                      countryEn: 'Mexico',  countryEs: 'México',        capacity: '87,523', imageKey: 'mexico-city' },
  { name: 'Estadio Akron',           cityEn: 'Guadalajara',                               cityEs: 'Guadalajara',                           countryEn: 'Mexico',  countryEs: 'México',        capacity: '49,850', imageKey: 'guadalajara' },
  { name: 'Estadio BBVA',            cityEn: 'Monterrey',                                 cityEs: 'Monterrey',                             countryEn: 'Mexico',  countryEs: 'México',        capacity: '53,500', imageKey: 'monterrey' },
  { name: 'SoFi Stadium',            cityEn: 'Los Angeles',                               cityEs: 'Los Ángeles',                           countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '70,240', imageKey: 'los-angeles' },
  { name: 'AT&T Stadium',            cityEn: 'Dallas',                                    cityEs: 'Dallas',                                countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '80,000', imageKey: 'dallas' },
  { name: 'MetLife Stadium',         cityEn: 'Nueva York/Nueva Jersey',                   cityEs: 'Nueva York/Nueva Jersey',               countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '82,500', imageKey: 'new-york' },
  { name: 'Hard Rock Stadium',       cityEn: 'Miami',                                     cityEs: 'Miami',                                 countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '64,767', imageKey: 'miami' },
  { name: "Levi's Stadium",          cityEn: 'Área de la Bahía de San Francisco',         cityEs: 'Área de la Bahía de San Francisco',     countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '68,500', imageKey: 'san-francisco' },
  { name: 'NRG Stadium',             cityEn: 'Houston',                                   cityEs: 'Houston',                               countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '72,220', imageKey: 'houston' },
  { name: 'Lincoln Financial Field', cityEn: 'Philadelphia',                              cityEs: 'Filadelfia',                            countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '69,796', imageKey: 'philadelphia' },
  { name: 'Gillette Stadium',        cityEn: 'Boston',                                    cityEs: 'Boston',                                countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '65,878', imageKey: 'boston' },
  { name: 'Mercedes-Benz Stadium',   cityEn: 'Atlanta',                                   cityEs: 'Atlanta',                               countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '71,000', imageKey: 'atlanta' },
  { name: 'Lumen Field',             cityEn: 'Seattle',                                   cityEs: 'Seattle',                               countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '68,740', imageKey: 'seattle' },
  { name: 'Arrowhead Stadium',       cityEn: 'Kansas City',                               cityEs: 'Kansas City',                           countryEn: 'USA',     countryEs: 'EE. UU.',       capacity: '76,416', imageKey: 'kansas-city' },
  { name: 'BC Place',                cityEn: 'Vancouver',                                 cityEs: 'Vancouver',                             countryEn: 'Canada',  countryEs: 'Canadá',        capacity: '54,500', imageKey: 'vancouver' },
  { name: 'BMO Field',               cityEn: 'Toronto',                                   cityEs: 'Toronto',                               countryEn: 'Canada',  countryEs: 'Canadá',        capacity: '45,736', imageKey: 'toronto' },
];

export function getUniqueVenues(data: WorldCupData): string[] {
  return [...new Set(data.matches.map(m => m.ground))];
}

// ──────────────────────────────────────────────
// Format helpers (español)
// ──────────────────────────────────────────────

/** Formatea la hora local (ej: "15:00") */
export function getMatchTimeStr(match: Match): string {
  try {
    return parseMatchDate(match.date, match.time)
      .toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  } catch (e) {
    return match.time ?? "--:--";
  }
}

/** Formatea la fecha en español (ej: "jue., 11 jun.") */
export function formatDate(match: Match): string {
  try {
    return parseMatchDate(match.date, match.time)
      .toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return match.date;
  }
}

/** Devuelve el ISO string UTC del partido (para usar en data-utc del cliente). */
export function getMatchUTC(match: Match): string {
  return parseMatchDate(match.date, match.time).toISOString();
}

export function hasScore(match: Match): boolean {
  return Boolean(match.score?.ft);
}

export function getScoreString(match: Match): string | null {
  if (!match.score?.ft) return null;
  let scoreStr = `${match.score.ft[0]} - ${match.score.ft[1]}`;
  if (match.score.p) {
    scoreStr += ` (${match.score.p[0]} - ${match.score.p[1]} pen.)`;
  }
  return scoreStr;
}
