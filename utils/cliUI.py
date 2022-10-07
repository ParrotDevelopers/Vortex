from colorama import init, Fore
import os
init()

banner = """
 __ __|  |                 _ \  _)              |               _ \   |                           
    |    __ \    _ \      |   |  |   __|  _` |  __|   _ \      |   |  |   _` |  |   |   _ \   __| 
    |    | | |   __/      ___/   |  |    (   |  |     __/      ___/   |  (   |  |   |   __/  |    
   _|   _| |_| \___|     _|     _| _|   \__,_| \__| \___|     _|     _| \__,_| \__, | \___| _|    
                                                                               ____/              
"""

lenght = len(banner.split("\n")[1])

def intro():
    print(
        Fore.GREEN,
        banner.center(os.get_terminal_size().columns)
    )
    print("=" * lenght)