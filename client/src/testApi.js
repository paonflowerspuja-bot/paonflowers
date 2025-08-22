import axios from "axios";

axios
  .get("https://jsonplaceholder.typicode.com/todos/1")
  .then((res) => console.log("Axios is working:", res.data))
  .catch((err) => console.error("Axios error:", err));
