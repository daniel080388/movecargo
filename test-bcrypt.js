import bcrypt from "bcryptjs";

async function teste() {
  const hash = "$2b$10$tM3Npvcf.B06B9jQqbrezuGEMOfQwdRebZETjDViFtyP021T.L9zW";
  const senha = "123456";

  const isValid = await bcrypt.compare(senha, hash);
  console.log("Senha válida?", isValid);
}

teste();
