const API_URL = "http://127.0.0.1:8000"
fetch(`${API_URL}/health`)
.then(res => res.json())
.then(data => {
    document.getElementById("status").innerText=data.status;
})
.catch(() => {
    document.getElementById("status").innerText="Data Not Reachable...."
})

document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  document.getElementById("darkModeToggle").innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});


const diaryinput= document.getElementById("diary-input");
const replybox= document.getElementById("replybox");
const savebtn= document.getElementById("save-btn");
const newpgbtn= document.getElementById("newpagebtn");
const pagelist = document.getElementById("pagelist");

function typeOutText(element,text,speedMs=25){
    return new Promise(resolve => {
        element.innerText="";
        element.classList.add("typing");
        let i = 0;

        function typeNextChar(){
            if(i<text.length){
                element.innerText += text[i];
                i++;
                setTimeout(typeNextChar,speedMs);
            }
            else{
                element.classList.remove("typing");
                resolve();
            }
        }
        typeNextChar();
    })
}

function showWritemode(){
    diaryinput.value="";
    diaryinput.style.display="block";
    replybox.style.display="none";
    replybox.innerText="";
    replybox.classList.remove("typing");
}

function showEntryinstant(entry){
    diaryinput.style.display="none";
    replybox.style.display="block";
    replybox.innerText=`You wrote:\n${entry.entry_text}\n\nThe diary replied:\n${entry.ai_reply}`;
}

async function loadPagelist(){
    try{
    const res = await fetch(`${API_URL}/entries`,{cache:"no-store"});
    if(!res.ok){
        console.error("Failed to load entries:",res.status);
        return;
    }

    const entries = await res.json();
    pagelist.innerHTML="";
    entries.forEach(entry => {
        const li = document.createElement("li");
        const preview=entry.entry_text.substring(0,30)+(entry.entry_text.length > 30 ? "..." : "");
        const date = new Date(entry.created_at).toLocaleDateString();
        li.innerText=`${date}:${preview}`;
        li.addEventListener("click",()=> showEntryinstant(entry));
        pagelist.appendChild(li);
    });
}catch(err){
    console.error("Error loading pagelist:",err);
}
}

savebtn.addEventListener("click", async() => {
    const text = diaryinput.value.trim();

    if(!text){
        alert("Write Something First.");
        return;
    }

    diaryinput.style.display="none";
    replybox.style.display="block";

    await typeOutText(replybox,"The diary is thinking ....",15);

    try {
        const res = await fetch(`${API_URL}/diary-response`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({text})
        });

        if(!res.ok){
            throw new Error("Request Failed");
        }

        const data = await res.json();
        await typeOutText(replybox, data.reply, 25);
        replybox.classList.add("glow-once");
        setTimeout(() => replybox.classList.remove("glow-once"), 1700);
        loadPagelist();
    }
    catch(err){
        console.error(err);
        await typeOutText(replybox,"Something disturbed the magic try again...",25);
    }
});

newpgbtn.addEventListener("click",showWritemode);

loadPagelist();

// newpgbtn.addEventListener("click",() =>{
//     diaryinput.value="";
//     diaryinput.style.display="block";
//     replybox.style.display="none";
//     replybox.innerText="";
//     savebtn.style.display="inline-block";
//     newpgbtn.style.display="none";
// })
