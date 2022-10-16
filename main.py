import os
from flask import Flask, render_template, url_for, json

app = Flask(__name__)

json_filename = os.path.join(app.static_folder, 'data', 'soccer_small.json')

with open(json_filename, 'r', encoding='utf8') as json_output:  # file not using CPC1252 encoding, pyflask standard 
    json_data = json.load(json_output)


@app.route('/')
def showjson():
    return json_data

# returns a player and all the player attributes
@app.route('/players/<name>')
def show_player(name):
    for item in json_data:
        if item["Name"] == name:
            print(item["Name"])
            return item

# returns all players and their attributes
@app.route('/players/')
def show_all_players():
    return json_data

# returns all countries with a list of players from those countries
@app.route('/countries/')
def show_countries():
    return None

# returns all clubs with a list of players playing for those clubs
@app.route('/clubs/')
def show_clubs():
    return None

# returns a list of all attribute names
@app.route('/attributes/')
def show_attributes():
    return None