const API_URL = "http://127.0.0.1:8000"
fetch(`${API_URL}/health`)
.then(res => res.json())
.then(data => {
    document.getElementById("status").innerText=data.status;
})
.catch(() => {
    document.getElementById("status").innerText="Data Not Reachable...."
})


const diaryinput= document.getElementById("diary-input");
const replybox= document.getElementById("replybox");
const savebtn= document.getElementById("save-btn");
const newpgbtn= document.getElementById("newpagebtn");

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

savebtn.addEventListener("click", async() => {
    const text = diaryinput.value.trim();

    if(!text){
        alert("Write Something First.");
        return;
    }

    diaryinput.style.display="none";
    replybox.style.display="block";
    savebtn.style.display="none";

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
        await typeOutText(replybox,data.reply,25);
    }
    catch(err){
        console.error(err);
        await typeOutText(replybox,"Something disturbed the magic try again...",25);
    }

    newpgbtn.style.display="inline-block";
});

newpgbtn.addEventListener("click",() =>{
    diaryinput.value="";
    diaryinput.style.display="block";
    replybox.style.display="none";
    replybox.innerText="";
    savebtn.style.display="inline-block";
    newpgbtn.style.display="none";
})
