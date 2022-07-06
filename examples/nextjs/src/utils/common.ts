export const COOKIE_NAME = "nc_users";
export const VIEW_COOKIE_NAME = "view_count";
export interface User {
  id: string;
  name: string;
  age: number;
}

export const validateUser = (user: User) => {
  user.name = user.name.trim();
  if (!user.name) throw new Error("Name cannot be empty");
  if (user.age < 8) {
    throw new Error("Aren't You a Little Young to be a Web Developer?");
  }
};
