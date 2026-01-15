import { Hono } from 'hono'

const app = new Hono().basePath("/api/v1")

app.post('/signup', (c) => {
  return c.text('Signup api!')
})

app.post('/signin', (c) => {
  return c.text('Signin api!')
})

app.post('/blog', (c) => {
return  c.json({
  "msg":"uploading a blog"
})
})

app.put('/blog',(c)=>{
  return c.json({
    "msg":"Updating blog"
  })
})

app.get('/blog/:id',(c)=>{
return c.json({
  "msg":"Getting all the blogs"
})
})

export default app
