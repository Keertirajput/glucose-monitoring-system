import string
sentence = input("Enter a string: ")
result = ""
for char in sentence:
    if char not in string.punctuation:
        result = result + char
print(result)