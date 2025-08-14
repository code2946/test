// Feature Engineering for Movie Content Vectors
// Converts movie metadata into L2-normalized vectors for cosine similarity

export interface MovieFeatures {
  id: number;
  title: string;
  genres: string[];
  vote_average: number;
  vote_count: number;
  cast: string[];
  directors: string[];
  cinematographers: string[];
  keywords: string[];
  release_year: number | null;
  runtime: number | null;
}

export interface FeatureWeights {
  genre: number;
  rating: number;
  cast: number;
  director: number;
  cinema: number;
  keywords: number;
  year: number;
  runtime: number;
}

// Standard genre vocabulary from TMDB
const GENRE_VOCAB = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
  'TV Movie', 'Thriller', 'War', 'Western'
];

// Year buckets for temporal features
const YEAR_BUCKETS = [
  { name: '<=1980', test: (y: number) => y <= 1980 },
  { name: '1981-1990', test: (y: number) => y >= 1981 && y <= 1990 },
  { name: '1991-2000', test: (y: number) => y >= 1991 && y <= 2000 },
  { name: '2001-2010', test: (y: number) => y >= 2001 && y <= 2010 },
  { name: '2011-2020', test: (y: number) => y >= 2011 && y <= 2020 },
  { name: '2021+', test: (y: number) => y >= 2021 },
];

// Runtime buckets for duration features
const RUNTIME_BUCKETS = [
  { name: 'short', test: (r: number) => r < 90 },
  { name: 'standard', test: (r: number) => r >= 90 && r <= 120 },
  { name: 'long', test: (r: number) => r > 120 && r <= 180 },
  { name: 'epic', test: (r: number) => r > 180 },
];

// Hash dimensions for text features (cast, directors, etc.)
const HASH_DIM = 512;

// Simple hash function for consistent feature mapping
function hashString(str: string, mod: number): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash = (hash ^ str.charCodeAt(i)) * 16777619;
  }
  return Math.abs(hash) % mod;
}

// Wilson score for rating confidence adjustment
function wilsonScore(positive: number, total: number, confidence = 0.95): number {
  if (total === 0) return 0;
  if (positive < 0 || positive > total) return 0;
  
  const z = 1.96; // 95% confidence interval
  const phat = positive / total;
  const numerator = phat + (z * z) / (2 * total) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * total)) / total);
  const denominator = 1 + (z * z) / total;
  
  return Math.max(0, Math.min(1, numerator / denominator));
}

// Build feature vector for a single movie
export function buildVector(
  movie: MovieFeatures, 
  weights: FeatureWeights = {
    genre: 1.0,
    rating: 0.5,
    cast: 0.8,
    director: 1.0,
    cinema: 0.7,
    keywords: 0.6,
    year: 0.3,
    runtime: 0.2
  }
): number[] {
  // Genre features (multi-hot encoding)
  const genreFeatures = new Array(GENRE_VOCAB.length).fill(0);
  (movie.genres || []).forEach(genre => {
    const idx = GENRE_VOCAB.indexOf(genre);
    if (idx >= 0) genreFeatures[idx] = 1;
  });

  // Rating feature with Wilson score adjustment
  const totalVotes = movie.vote_count || 0;
  const positiveVotes = Math.round((movie.vote_average || 0) * totalVotes / 10);
  const ratingFeature = wilsonScore(positiveVotes, totalVotes);

  // Year features (one-hot encoding)
  const yearFeatures = new Array(YEAR_BUCKETS.length).fill(0);
  if (movie.release_year) {
    const bucketIdx = YEAR_BUCKETS.findIndex(bucket => bucket.test(movie.release_year!));
    if (bucketIdx >= 0) yearFeatures[bucketIdx] = 1;
  }

  // Runtime features (one-hot encoding)
  const runtimeFeatures = new Array(RUNTIME_BUCKETS.length).fill(0);
  if (movie.runtime) {
    const bucketIdx = RUNTIME_BUCKETS.findIndex(bucket => bucket.test(movie.runtime!));
    if (bucketIdx >= 0) runtimeFeatures[bucketIdx] = 1;
  }

  // Cast features (hashed bag-of-names)
  const castFeatures = new Array(HASH_DIM).fill(0);
  (movie.cast || []).forEach(name => {
    const hash = hashString(`cast:${name.toLowerCase()}`, HASH_DIM);
    castFeatures[hash] = 1;
  });

  // Director features (hashed bag-of-names)
  const directorFeatures = new Array(HASH_DIM).fill(0);
  (movie.directors || []).forEach(name => {
    const hash = hashString(`dir:${name.toLowerCase()}`, HASH_DIM);
    directorFeatures[hash] = 1;
  });

  // Cinematographer features (hashed bag-of-names)
  const cinemaFeatures = new Array(HASH_DIM).fill(0);
  (movie.cinematographers || []).forEach(name => {
    const hash = hashString(`cin:${name.toLowerCase()}`, HASH_DIM);
    cinemaFeatures[hash] = 1;
  });

  // Keywords features (hashed bag-of-terms)
  const keywordFeatures = new Array(HASH_DIM).fill(0);
  (movie.keywords || []).forEach(keyword => {
    const hash = hashString(`kw:${keyword.toLowerCase()}`, HASH_DIM);
    keywordFeatures[hash] = 1;
  });

  // Assemble weighted feature vector
  let vector: number[] = [];
  vector = vector
    .concat(genreFeatures.map(x => x * weights.genre))
    .concat([ratingFeature * weights.rating])
    .concat(yearFeatures.map(x => x * weights.year))
    .concat(runtimeFeatures.map(x => x * weights.runtime))
    .concat(castFeatures.map(x => x * weights.cast))
    .concat(directorFeatures.map(x => x * weights.director))
    .concat(cinemaFeatures.map(x => x * weights.cinema))
    .concat(keywordFeatures.map(x => x * weights.keywords));

  // L2 normalize
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map(val => val / norm);
}

// Compute cosine similarity between two vectors
export function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Compute centroid (average) of multiple vectors
export function computeCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  
  const dim = vectors[0].length;
  const centroid = new Array(dim).fill(0);
  
  vectors.forEach(vector => {
    for (let i = 0; i < dim; i++) {
      centroid[i] += vector[i];
    }
  });
  
  for (let i = 0; i < dim; i++) {
    centroid[i] /= vectors.length;
  }
  
  // L2 normalize the centroid
  const norm = Math.sqrt(centroid.reduce((sum, val) => sum + val * val, 0)) || 1;
  return centroid.map(val => val / norm);
}

// Batch process movies for vector computation
export function batchVectorize(
  movies: MovieFeatures[],
  weights?: FeatureWeights
): { id: number; vector: number[] }[] {
  return movies.map(movie => ({
    id: movie.id,
    vector: buildVector(movie, weights)
  }));
}

// Get feature vector dimensions
export function getVectorDimensions(): number {
  return (
    GENRE_VOCAB.length +      // genres
    1 +                       // rating
    YEAR_BUCKETS.length +     // year buckets
    RUNTIME_BUCKETS.length +  // runtime buckets
    HASH_DIM +               // cast
    HASH_DIM +               // directors
    HASH_DIM +               // cinematographers
    HASH_DIM                 // keywords
  );
}

// Default feature weights
export const DEFAULT_WEIGHTS: FeatureWeights = {
  genre: 1.0,
  rating: 0.5,
  cast: 0.8,
  director: 1.0,
  cinema: 0.7,
  keywords: 0.6,
  year: 0.3,
  runtime: 0.2
};

// Validate feature weights (should sum to reasonable total)
export function validateWeights(weights: FeatureWeights): boolean {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return total > 0 && total <= 10; // reasonable bounds
}