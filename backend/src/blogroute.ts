import { Hono } from "hono";

const blog = new Hono()

blog.post('/blog', (c) => {
    return c.json({
        "msg": "uploading a blog",
    })
})

blog.put('/blog', (c) => {
    return c.json({
        "msg": "Updating blog"
    })
})

blog.get('/blog/:id', async (c) => {
    // console.log(await c.req.json())
    console.log("LOG -> " + c.req.param("id"))
    return c.json({
        "msg": "234",
        "params_:id": c.req.param("id")
    })
})

blog.get('/blog/bulk', async (c) => {
    // console.log(await c.req.json())
    console.log("LOG -> " + c.req.param("id"))
    return c.json({
        "msg": "234",
        "params_:id": c.req.param("id")
    })
})


export { blog } 
