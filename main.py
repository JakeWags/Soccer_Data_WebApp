import os
from flask import Flask, render_template, url_for, json

app = Flask(__name__)

json_data = os.path.join(app.static_folder, 'data', 'soccer_small.json')

@app.route('/')
def showjson():
    with open(json_data, 'r', encoding='utf8') as json_output:  # file not using CPC1252 encoding, pyflask standard 
        data = app.json.load(json_output)
    return render_template('output.html', data=data)