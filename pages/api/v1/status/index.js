function status(request, response) {
  response.status(200).json({ chave: "sou zika" });
}

export default status;
