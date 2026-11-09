// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title NoritaFarm: an on-chain farming game for Elysium.
/// @notice The contract is also the NRT ERC-20 token. Players plant crops on plots,
/// wait for them to grow (block.timestamp), and harvest them for newly minted NRT.
/// Seeds and new plots are paid for by burning NRT.
contract NoritaFarm {
    // ---------------------------------------------------------------- ERC-20
    string public constant name = "Norita";
    string public constant symbol = "NRT";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) {
            require(a >= value, "allowance");
            allowance[from][msg.sender] = a - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "zero address");
        require(balanceOf[from] >= value, "balance");
        unchecked {
            balanceOf[from] -= value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        unchecked { balanceOf[to] += value; }
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        require(balanceOf[from] >= value, "not enough NRT");
        unchecked {
            balanceOf[from] -= value;
            totalSupply -= value;
        }
        emit Transfer(from, address(0), value);
    }

    // ---------------------------------------------------------------- game
    struct Crop {
        uint256 cost;     // NRT burned to plant
        uint256 reward;   // NRT minted on harvest
        uint32 growTime;  // seconds
        uint32 xp;        // XP on harvest
        uint32 minLevel;  // level needed to plant
    }

    struct Plot {
        uint8 crop;       // crop id + 1 (0 = empty)
        uint64 plantedAt;
    }

    uint8 public constant START_PLOTS = 6;
    uint8 public constant MAX_PLOTS = 12;
    uint256 public constant STARTER_GRANT = 20 ether;
    uint256 public constant FIRST_PLOT_PRICE = 50 ether;
    uint32 public constant XP_PER_LEVEL = 100;

    Crop[] public crops;
    mapping(address => bool) public joined;
    mapping(address => uint32) public xp;
    mapping(address => uint8) public plotCount;
    mapping(address => Plot[MAX_PLOTS]) internal plots;

    event Joined(address indexed player);
    event Planted(address indexed player, uint8 plot, uint8 crop);
    event Harvested(address indexed player, uint8 plot, uint8 crop, uint256 reward);
    event PlotBought(address indexed player, uint8 plotCount, uint256 price);

    constructor() {
        // Keep in sync with farm/config.js
        crops.push(Crop(5 ether, 8 ether, 30, 2, 1));        // Turnip
        crops.push(Crop(15 ether, 28 ether, 120, 6, 1));     // Potato
        crops.push(Crop(40 ether, 90 ether, 300, 15, 2));    // Corn
        crops.push(Crop(120 ether, 300 ether, 900, 40, 4));  // Tomato
        crops.push(Crop(400 ether, 1100 ether, 3600, 120, 6)); // Pumpkin
    }

    function cropCount() external view returns (uint256) {
        return crops.length;
    }

    function level(address player) public view returns (uint32) {
        return xp[player] / XP_PER_LEVEL + 1;
    }

    /// @notice Price of the next plot: doubles with each plot bought.
    function nextPlotPrice(address player) public view returns (uint256) {
        uint8 n = plotCount[player];
        if (n < START_PLOTS) n = START_PLOTS;
        return FIRST_PLOT_PRICE << (n - START_PLOTS);
    }

    /// @notice One-time start: gives the starter NRT and the first plots.
    function join() external {
        require(!joined[msg.sender], "already joined");
        joined[msg.sender] = true;
        plotCount[msg.sender] = START_PLOTS;
        _mint(msg.sender, STARTER_GRANT);
        emit Joined(msg.sender);
    }

    function plant(uint8 plot, uint8 crop) public {
        require(plot < plotCount[msg.sender], "no such plot");
        require(crop < crops.length, "no such crop");
        Plot storage p = plots[msg.sender][plot];
        require(p.crop == 0, "plot in use");
        Crop memory c = crops[crop];
        require(level(msg.sender) >= c.minLevel, "level too low");
        _burn(msg.sender, c.cost);
        p.crop = crop + 1;
        p.plantedAt = uint64(block.timestamp);
        emit Planted(msg.sender, plot, crop);
    }

    /// @notice Plant the same crop on several plots in one transaction.
    function plantMany(uint8[] calldata plotIds, uint8 crop) external {
        for (uint256 i; i < plotIds.length; ++i) plant(plotIds[i], crop);
    }

    function harvest(uint8 plot) public {
        require(_harvest(plot), "not ready");
    }

    /// @notice Harvest every ready plot. Reverts if nothing was ready.
    function harvestAll() external {
        bool any;
        uint8 n = plotCount[msg.sender];
        for (uint8 i; i < n; ++i) if (_harvest(i)) any = true;
        require(any, "nothing ready");
    }

    function _harvest(uint8 plot) internal returns (bool) {
        if (plot >= plotCount[msg.sender]) return false;
        Plot storage p = plots[msg.sender][plot];
        if (p.crop == 0) return false;
        uint8 id = p.crop - 1;
        Crop memory c = crops[id];
        if (block.timestamp < p.plantedAt + c.growTime) return false;
        p.crop = 0;
        p.plantedAt = 0;
        xp[msg.sender] += c.xp;
        _mint(msg.sender, c.reward);
        emit Harvested(msg.sender, plot, id, c.reward);
        return true;
    }

    function buyPlot() external {
        uint8 n = plotCount[msg.sender];
        require(joined[msg.sender], "join first");
        require(n < MAX_PLOTS, "max plots");
        uint256 price = nextPlotPrice(msg.sender);
        _burn(msg.sender, price);
        plotCount[msg.sender] = n + 1;
        emit PlotBought(msg.sender, n + 1, price);
    }

    /// @notice Everything the game page needs in one call.
    /// @return crop per plot (crop id + 1, 0 = empty), plantedAt per plot,
    /// the player's plot count, XP and NRT balance.
    function getFarm(address player)
        external
        view
        returns (uint8[] memory crop, uint64[] memory plantedAt, uint8 count, uint32 playerXp, uint256 balance)
    {
        count = plotCount[player];
        crop = new uint8[](count);
        plantedAt = new uint64[](count);
        for (uint8 i; i < count; ++i) {
            crop[i] = plots[player][i].crop;
            plantedAt[i] = plots[player][i].plantedAt;
        }
        playerXp = xp[player];
        balance = balanceOf[player];
    }
}
