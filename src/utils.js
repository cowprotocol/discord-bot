function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function codeBlock(message) {
  return '```' + message + '```';
}

function helloMsgReply(msg) {
  if (msg.length < 2) {
    return 'Hi';
  }
  const normalized = msg.replace(/\s+/g, ' ').toLowerCase();
  return `${normalized[0].toUpperCase()}${normalized.substring(1)}`;
}

function pickFromList(list) {
  let count = -1;
  return () => {
    count += 1;
    if (count > list.length - 1) {
      count = 0;
    }
    return list[count];
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(operation, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delay);
      delay *= 2; // exponential backoff
    }
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}

module.exports = {
  formatNumber,
  codeBlock,
  helloMsgReply,
  pickFromList,
  sleep,
  retryOperation,
  formatDuration
};