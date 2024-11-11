// la ou les fonctions dans ce fichier auront comme objectif de :
// verifier si le client demande un changement d'informations 
// si oui, modifier les informations du client et retourner un message de confirmation
// si non, alors rien.  


// To complete : 
const updateCheck = (messageContent, conversationHistory) => {

    const updatePrompt = `
        Only answer with yes or no in one word.
        Based on the following converstion history: ${conversationHistory}
        Does the customer request to update his information ?
    `

}

module.exports = updateCheck;