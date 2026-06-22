class Cage:

    """

    Parameters:
        value (int): value of the cage
        sign (chr): one of +, -, *, /, =
        coords (list): coordinates of the cage as a list of 0-indexed integer tuples
    """
    def __init__(self, value : int, sign : chr, coords: list[ tuple[int,int]]):
        self.value = value
        self.sign = sign
        self.coords = coords