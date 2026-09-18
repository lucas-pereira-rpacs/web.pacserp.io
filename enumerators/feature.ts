export const Feature = {
  Email: 'email',
} as const;

export const Features = [Feature.Email] as const;

export type Feature = (typeof Features)[number];
