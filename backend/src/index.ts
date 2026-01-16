import { Hono } from 'hono'
import { PrismaClient } from "./generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
const app = new Hono().basePath("/api/v1")


app.post('/signup', (c) => {
  return c.text('Signup api!')
})

app.post('/signin', (c) => {
  return c.text('Signin api!')
})

app.post('/blog', (c) => {
  return c.json({
    "msg": "uploading a blog"
  })
})

app.put('/blog', (c) => {
  return c.json({
    "msg": "Updating blog"
  })
})

app.get('/blog/:id', (c) => {
  console.log("LOG -> " + c.req.query("we"))
  return c.json({
    "msg": "234"
  })
})

export default app
