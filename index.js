//imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require('./User');

const app = express();

//config json response

app.use(express.json());

//Open Route - Public Route
app.get("/" , (req, res) => {res.status(200).json({ msg: "Bem Vindo a nossa APi"}) 
})

// Private Route
app.get("/user/:id", checkToken,  async (req, res) => {
  const id = req.params.id

  // check if user exists
  const user = await User.findById(id, "-password");

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  res.status(200).json({ user });
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Acesso negado!" });

  try {
    const secret = process.env.SECRET;

    jwt.verify(token, secret);

    next();
  } catch (err) {
    res.status(400).json({ msg: "O Token é inválido!" });
  }
}

//register User

app.post("/auth/register", async (req, res) => {
    const { name, email, password, confirmpassword } = req.body;

//validations

if(!name){
return res.status(422).json({msg: 'o nome é obrigátorio'})
}
if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
}
if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
}

if (password != confirmpassword) {
    return res
      .status(422)
      .json({ msg: "A senha e a confirmação precisam ser iguais!" });
  }

 // check if user exists
 const userExists = await User.findOne({ email: email });

 if (userExists) {
   return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
 }

 // create password
 const salt = await bcrypt.genSalt(12);
 const passwordHash = await bcrypt.hash(password, salt);

 // create user
 const user = new User({
   name, 
   email,
   password: passwordHash,
 });

 try {
   await user.save();

   res.status(201).json({ msg: "Usuário criado com sucesso!" });
 } catch (error) {
   res.status(500).json({ msg: 'Aconteceu um erro no servidor, tente novamente mais tarde' });
 }/**/
})

//login User
app.post("/auth/login", async (req, res) => {
  const {email,password} = req.body


  // validations
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  // check if user exists
  const user = await User.findOne({ email: email });

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

// check if password match
const checkPassword = await bcrypt.compare(password, user.password);

if (!checkPassword) {
  return res.status(422).json({ msg: "Senha inválida" });
}

try {
  const secret = process.env.SECRET;

  const token = jwt.sign(
    {
      id: user._id,
    },
    secret
  );

  res.status(200).json({ msg: "Autenticação realizada com sucesso!", token });
} catch (error) {
  res.status(500).json({ msg: error });
}

})

//credenciais
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose
.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.ygymb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`)
.then(() => {
    app.listen(1024)
    console.log('conectou ao banco')
})
    .catch((err) => console.log(err) )



