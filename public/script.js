let conversationHistory = []; // To keep track of questions and answers

// Show loading spinner
function showLoading() {
    document.getElementById("loading-spinner").style.display = "block";
}

// Hide loading spinner
function hideLoading() {
    document.getElementById("loading-spinner").style.display = "none";
}

// Handle PDF Upload
document.getElementById("pdf-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    showLoading(); // Show loading spinner while uploading PDF

    const formData = new FormData();
    formData.append("pdf", document.querySelector('[name="pdf"]').files[0]);

    const response = await fetch("/upload-pdf", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    hideLoading(); // Hide loading spinner after PDF is processed

    if (result.summary) {
        document.getElementById("summary").innerText = result.summary;
    } else {
        document.getElementById("summary").innerText = "Error: " + result.error;
    }
});

// Handle Question Submission
document.getElementById("ask-button").addEventListener("click", async () => {
    const question = document.getElementById("question").value;
    if (!question) {
        alert("Please enter a question.");
        return;
    }

    showLoading(); // Show loading spinner while processing question

    const response = await fetch("/ask-question", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
    });

    const result = await response.json();
    hideLoading(); // Hide loading spinner after processing the question

    const answer = result.answer || "No answer found.";

    // Add the question and answer to the conversation history
    conversationHistory.push({ question, answer });

    // Update the conversation log
    updateConversationLog();

    // Clear the question input
    document.getElementById("question").value = "";
});

// Update the conversation log
function updateConversationLog() {
    const conversationElement = document.getElementById("conversation");
    conversationElement.innerHTML = ""; // Clear current conversation

    // Loop through the conversation history and append each Q&A
    conversationHistory.forEach(({ question, answer }) => {
        const questionElement = document.createElement("p");
        questionElement.innerHTML = `<strong>Q:</strong> ${question}`;
        conversationElement.appendChild(questionElement);

        const answerElement = document.createElement("p");
        answerElement.innerHTML = `<strong>A:</strong> ${answer}`;
        conversationElement.appendChild(answerElement);
    });

    // Scroll to the bottom to show the latest Q&A
    conversationElement.scrollTop = conversationElement.scrollHeight;
}
