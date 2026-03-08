const input = document.getElementById("searchBox")
const results = document.getElementById("results")
const fileInput = document.getElementById("file")

input.addEventListener("input", async ()=>{

  const text = input.value

  if(text.length === 0){

    results.innerHTML=""
    return

  }

  const res = await fetch("/search",{

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body:JSON.stringify({query:text})

  })

  const data = await res.json()

  results.innerHTML=""

  if(data.source==="db"){

    data.results.forEach(r=>{

      const div=document.createElement("div")

      div.innerText=r.content

      results.appendChild(div)

    })

  }

  if(data.source==="ai"){

    const div=document.createElement("div")

    div.innerText=data.results[0].content

    div.style.color="blue"

    results.appendChild(div)

  }

})

fileInput.addEventListener("change", async ()=>{

  const file = fileInput.files[0]

  const form = new FormData()

  form.append("file",file)

  await fetch("/upload",{

    method:"POST",

    body:form

  })

  alert("upload xong")

})
