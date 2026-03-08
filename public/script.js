async function search(){

  const q = document.getElementById("searchBox").value

  const res = await fetch("/search",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({query:q})
  })

  const data = await res.json()

  const div = document.getElementById("result")

  div.innerHTML=""

  if(data.type==="database"){

    data.data.forEach(r=>{
      const p=document.createElement("p")
      p.innerText=r.content
      div.appendChild(p)
    })

  }

  if(data.type==="ai"){

    div.innerText=data.data

  }

}
async function upload(){

  const file = document.getElementById("file").files[0]

  const form = new FormData()

  form.append("file",file)

  await fetch("/upload",{
    method:"POST",
    body:form
  })

  alert("upload xong")

}
