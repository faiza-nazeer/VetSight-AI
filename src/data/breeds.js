// The four breeds in project scope. Species is derived from the breed.
export const BREEDS = [
  { id: 'Sahiwal', species: 'cattle' },
  { id: 'Tharparkar', species: 'cattle' },
  { id: 'Nili-Ravi', species: 'buffalo' },
  { id: 'Kundi', species: 'buffalo' },
];
export const GENDERS = ['female', 'male'];
export const breedSpecies = (id) => BREEDS.find((b) => b.id === id)?.species || 'cattle';
