
let current="ts"

function typeOf(v){
if(Array.isArray(v)) return "array"
if(v===null) return "any"
if(typeof v==="string") return "string"
if(typeof v==="number") return "number"
if(typeof v==="boolean") return "boolean"
if(typeof v==="object") return "object"
return "any"
}

function walk(obj,name,models){
let fields=[]
for(let k in obj){
let v=obj[k]
let t=typeOf(v)
if(t==="object"){
let child=name+capitalize(k)
walk(v,child,models)
fields.push({key:k,type:child})
}
else if(t==="array"){
if(v.length>0 && typeof v[0]==="object"){
let child=name+capitalize(k)
walk(v[0],child,models)
fields.push({key:k,type:child+"[]"})
}else{
fields.push({key:k,type:"any[]"})
}
}
else{
fields.push({key:k,type:t})
}
}
models[name]=fields
}

function capitalize(s){
return s.charAt(0).toUpperCase()+s.slice(1)
}

function buildModels(data){
let models={}
walk(data,"Model",models)
return models
}

function makeTS(models){
let out=""
for(let m in models){
out+="interface "+m+" {\n"
models[m].forEach(f=>{
let t=f.type
if(t==="string") t="string"
if(t==="number") t="number"
if(t==="boolean") t="boolean"
if(t==="any") t="any"
out+="  "+f.key+": "+t+"\n"
})
out+="}\n\n"
}
return out
}

function makePython(models){
let out=""
for(let m in models){
out+="class "+m+":\n"
out+="    def __init__(self"
models[m].forEach(f=>{out+=", "+f.key})
out+="):\n"
models[m].forEach(f=>{out+="        self."+f.key+" = "+f.key+"\n"})
out+="\n"
}
return out
}

function makeGraph(models){
let out=""
for(let m in models){
out+="type "+m+" {\n"
models[m].forEach(f=>{
let t=f.type
if(t==="string") t="String"
if(t==="number") t="Float"
if(t==="boolean") t="Boolean"
if(t==="any") t="JSON"
out+="  "+f.key+": "+t+"\n"
})
out+="}\n\n"
}
return out
}

function makeSQL(models){
let first=true
let out=""
for(let m in models){
out+="CREATE TABLE "+m.toLowerCase()+" (\n"
models[m].forEach((f,i)=>{
let t=f.type
if(t==="string") t="TEXT"
else if(t==="number") t="INTEGER"
else if(t==="boolean") t="BOOLEAN"
else t="JSON"
out+="  "+f.key+" "+t
if(i<models[m].length-1) out+=","
out+="\n"
})
out+=");\n\n"
}
return out
}

function convert(){
let text=document.getElementById("json").value
let status=document.getElementById("status")
let obj
try{
obj=JSON.parse(text)
status.textContent="Valid JSON"
}catch{
status.textContent="Invalid JSON"
return
}

let models=buildModels(obj)
let result=""

if(current==="ts") result=makeTS(models)
if(current==="python") result=makePython(models)
if(current==="graphql") result=makeGraph(models)
if(current==="sql") result=makeSQL(models)

document.getElementById("output").textContent=result
}

document.querySelectorAll(".tabs button").forEach(b=>{
b.onclick=function(){
document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"))
this.classList.add("active")
current=this.dataset.tab
convert()
}
})

document.getElementById("convert").onclick=convert

document.getElementById("copy").onclick=function(){
let t=document.getElementById("output").textContent
navigator.clipboard.writeText(t)
}

document.getElementById("download").onclick=function(){
let text=document.getElementById("output").textContent
let blob=new Blob([text])
let a=document.createElement("a")
a.href=URL.createObjectURL(blob)
a.download="model.txt"
a.click()
}

document.getElementById("format").onclick=function(){
let t=document.getElementById("json")
try{
let obj=JSON.parse(t.value)
t.value=JSON.stringify(obj,null,2)
}catch{}
}

document.getElementById("clear").onclick=function(){
document.getElementById("json").value=""
document.getElementById("output").textContent=""
}

document.getElementById("sample").onclick=function(){
document.getElementById("json").value=`{
"user":{
"id":1,
"name":"Alex",
"email":"alex@mail.com",
"active":true,
"profile":{
"age":24,
"country":"Denmark"
}
},
"posts":[
{
"id":10,
"title":"Hello",
"likes":12
}
]
}`
}

document.getElementById("theme").onclick=function(){
document.body.classList.toggle("light")
}
