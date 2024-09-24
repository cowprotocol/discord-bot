const { Web3 } = require('web3');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { 
  TOKEN_ADDRESS, STAKING_CONTRACT_ADDRESS, UNISWAP_POOL_ADDRESS, 
  UNISWAP_POOL_ABI, LARGE_SWAP_AMOUNT, LARGE_STAKE_AMOUNT, WEB3_PROVIDER,
  ARBISCAN_API_KEY, CHANNEL_ID
} = require('./config');
const { sendAlert } = require('./discordUtils');
const { createTransferEmbed, createStakeEmbed, createSwapEmbed } = require('./embeds');


const web3 = new Web3(WEB3_PROVIDER);

let highestCheckedBlock = 0;
const processedTransactions = new Set();

let client; // Declare a variable to hold the client

async function checkTransfers(client) {
  const currentBlock = await getLatestBlockNumber();
  if (highestCheckedBlock === 0) {
    highestCheckedBlock = currentBlock - 1;
  }
  if (currentBlock <= highestCheckedBlock) {
    return;        
  }
  const transfers = await getTokenTransfers(highestCheckedBlock, currentBlock);
  highestCheckedBlock = currentBlock;

  const hasLargeTransfer = transfers.some(transfer => 
    Number(transfer.value) >= LARGE_STAKE_AMOUNT
  );

  let tokenPrice = null;
  if (hasLargeTransfer) {
    tokenPrice = await getSeedTokenPrice();  
  }

  for (const transfer of transfers) {
    const amount = parseFloat(transfer.value) / 1e18;
    const usdValue = tokenPrice !== null ? amount * tokenPrice : 0;
    const txHash = transfer.hash;
    const displayText = `${txHash.substring(0, 6)}...${txHash.substring(txHash.length - 4)}`;

    if (processedTransactions.has(txHash)) {
      console.log(`Transaction ${txHash} has already been processed.`);
      continue;
    }
    processedTransactions.add(txHash);   

    if (transfer.to.toLowerCase() === STAKING_CONTRACT_ADDRESS.toLowerCase() && amount >= LARGE_STAKE_AMOUNT) {
      const embed = new EmbedBuilder()
        .setTitle('🌸 Large SEED 🌱 Stake 🌸')
        .addFields([
            { name: 'SEED 🌱 Staked', value: amount.toString() },
            { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
            { name: 'Tx Hash', value: `[${displayText}](https://arbiscan.io/tx/${txHash})` }
        ]);
      sendAlert(client, embed, CHANNEL_ID);
    } else if (amount >= LARGE_SWAP_AMOUNT) {
        const receipt = await getTransactionReceipt(transfer.hash);
        const isSwap = receipt.logs.some(log => 
          log.address.toLowerCase() === UNISWAP_POOL_ADDRESS.toLowerCase() && 
          log.topics[0] === web3.utils.sha3('Swap(address,address,int256,int256,uint160,uint128,int24)')
        );

        if (isSwap) {
            const swapDetails = receipt.logs.find(log => log.address.toLowerCase() === UNISWAP_POOL_ADDRESS.toLowerCase());
            console.log('Raw swapDetails data:', swapDetails);

            if (swapDetails && swapDetails.data && swapDetails.topics.length > 1) {
                console.log('swapDetails.address:', swapDetails.address);
                console.log('swapDetails.topics:', swapDetails.topics);
                console.log('swapDetails.data:', swapDetails.data);

                try {
                    if (swapDetails.data.length < 320) {
                        throw new Error('Log data is shorter than expected for a Swap event');
                    }

                    const amount0 = BigInt('0x' + swapDetails.data.slice(2, 66));
                    const amount1 = BigInt('0x' + swapDetails.data.slice(66, 130));
                    const sqrtPriceX96 = BigInt('0x' + swapDetails.data.slice(130, 194));
                    const liquidity = BigInt('0x' + swapDetails.data.slice(194, 258));
                    const tick = parseInt('0x' + swapDetails.data.slice(258, 290), 16);

                    const swapEvent = {
                        sender: swapDetails.topics[1],
                        recipient: swapDetails.topics[2],
                        amount0,
                        amount1,
                        sqrtPriceX96,
                        liquidity,
                        tick
                    };

                    console.log('Decoded swapEvent:', swapEvent);

                    const token0 = await getToken0Address(UNISWAP_POOL_ADDRESS);
                    const isSeedBuy = (token0.toLowerCase() === TOKEN_ADDRESS.toLowerCase());

                    if (isSeedBuy) {
                      const seedAmount = Number(swapEvent.amount0) / 1e18; // Adjust based on SEED decimals
                      const embed = new EmbedBuilder()
                        .setTitle('🌸 Large SEED 🌱 Swap 🌸')
                        .addFields([
                            { name: 'SEED 🌱 Bought', value: seedAmount.toString() },
                            { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
                            { name: 'Tx Hash', value: `[${displayText}](https://arbiscan.io/tx/${txHash})` }
                        ]);
                      sendAlert(client, embed, CHANNEL_ID);
                    }
                } catch (error) {
                    console.error('Error processing swap event:', error);
                }
            } else {
                console.error('Invalid swapDetails data or topics:', swapDetails);
            }
        } else {
            const embed = new EmbedBuilder()
                .setTitle('🌸 Large SEED 🌱 Transfer 🌸')
                .addFields([
                    { name: 'SEED 🌱 Transferred', value: amount.toString() },
                    { name: 'USD Value 💵', value: `$${usdValue.toFixed(2)}` },
                    { name: 'Tx Hash', value: `[${displayText}](https://arbiscan.io/tx/${txHash})` }
                ]);
            sendAlert(client, embed, CHANNEL_ID);
        }
    }
  }
}
async function getLatestBlockNumber() {
  const response = await axios.get(`https://api.arbiscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ARBISCAN_API_KEY}`);
  return parseInt(response.data.result, 16);
}

async function getTokenTransfers(startBlock, endBlock) {
  const response = await axios.get(`https://api.arbiscan.io/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${ARBISCAN_API_KEY}`);
  return response.data.result;
}

async function getTransactionReceipt(txHash) {
  return await web3.eth.getTransactionReceipt(txHash);
}
async function getToken0Address(poolAddress) {
  const poolContract = new web3.eth.Contract(UNISWAP_POOL_ABI, poolAddress);
  return await poolContract.methods.token0().call();
}
async function getSeedTokenPrice() {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=garden-2&vs_currencies=usd');
  return response.data['garden-2'].usd;
}

module.exports = { 
  checkTransfers,
  getLatestBlockNumber,
  getTokenTransfers,
  getTransactionReceipt,
  getToken0Address,
  getSeedTokenPrice
 };