import os

from flask import Flask, json, send_from_directory, render_template

app = Flask(__name__)

json_filename = os.path.join(app.static_folder, 'data', 'soccer_small.json')

with open(json_filename, 'r', encoding='utf8') as json_output:  # file not using CPC1252 encoding, pyflask standard 
    json_data = json.load(json_output)


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/table')
def display_table():
    return render_template('table.html')

# returns a player and all the player attributes
@app.route('/players/<name>')
def show_player(name):
    for player in json_data:
        if player["Name"] == name:
            return player

# returns all players and their attributes
@app.route('/players/')
def show_all_players():
    return send_from_directory(app.static_folder + '/data/', 'soccer_small.json')

# returns all countries with a list of players from those countries
@app.route('/countries/')
def show_countries():
    return get_value_and_format('Nationality')

# returns all clubs with a list of players playing for those clubs
@app.route('/clubs/')
def show_clubs():
    return get_value_and_format('Club')

# returns a list of all attribute names
@app.route('/attributes/')
def show_attributes():
    return list(json_data[0].keys())


# returns a JSON string containing a list of clubs or countries with their players
# helper method for '/clubs/' or '/countries/'
def get_value_and_format(to_get):
    ret_array = [] # array of python dicts, to be turned into json data... country example:
                   # {
                   #    'Name': 'Spain'
                   #    'Players': [
                   #               'Sergio Ramos',
                   #               'Jordi Alba'     
                   #               ]   
                   # }
    for player in json_data:
        player_value = player[to_get]
        player_name = player["Name"]

        is_in_list = False
        for item in ret_array:
            if item['Name'] == player_value:
                is_in_list = True
                item['Players'].append(player_name)
                break

        # if the value is not present in the list, create a new dictionary
        if is_in_list == False:
            ret_array.append({
                'Name': player_value,
                'Players': [player_name]
            });

    # Sort alphabetically by name
    ret_array = sorted(ret_array, key=lambda d: d['Name'])

    return json.jsonify(ret_array)
