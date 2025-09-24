import bcrypt from "bcryptjs";

const hash = "$2b$10$tM3Npvcf.B06B9jQqbrezuGEMOfQwdRebZETjDViFtyP021T.L9zW"; // hash do banco
const senha = "123456";

bcrypt.compare(senha, hash).then(result => {
  console.log("Senha válida?", result);
});
