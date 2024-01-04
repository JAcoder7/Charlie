# Charlie
A prototype chatbot designed to make online banking easier, created during a hackathon

## Try it out:
https://jacoder7.github.io/Charlie/


## How it works
The chatbot compares the user's input with a json list of predefined inputs and their responses. It returns the answer to the input that most closely matches the user's input. In addition, some inputs trigger special actions, such as a bank transfer. 


To calculate how similar the user input is to one of the predefined inputs in the list, it is first broken down into individual words. The algorithm then counts the number of these words or similar words (using the Levenshtein algorithm) that are contained in the predefined input in the list. In addition, some of the words can be weighted more than others.
