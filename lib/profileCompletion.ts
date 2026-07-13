export type ProfileCompletionInput = {
  firstName?: string | null;
  lastName?: string | null;
};

export function isProfileComplete(profile: ProfileCompletionInput) {
  return Boolean(profile.firstName?.trim() && profile.lastName?.trim());
}

export function getMissingProfileCompletionFields(
  profile: ProfileCompletionInput
): string[] {
  const fields: Array<[string, string | null | undefined]> = [
    ["first name", profile.firstName],
    ["last name", profile.lastName],
  ];

  return fields.filter(([, value]) => !value?.trim()).map(([label]) => label);
}
