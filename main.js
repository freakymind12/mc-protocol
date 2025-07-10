const McProtocolClient = require("node-mc_protocol");

// Fungsi utama untuk inisialisasi client
function createClient(ip, port = 5000) {
  const options = {
    pcNo: 0xff,
    networkNo: 0x00,
    unitIoNo: [0xff, 0x03],
    unitStationNo: 0x00,
    protocolFrame: "3E",
    plcModel: "Q",
  };

  return new McProtocolClient(ip, port, options);
}

// Fungsi untuk membaca 1 word atau lebih
async function readPLC(ip, port, dmAddress, length = 1) {
  const client = createClient(ip, port);

  try {
    await client.open();

    let result;
    if (length === 1) {
      result = await client.getWord(dmAddress);
      console.log(`Nilai dari ${dmAddress}:`, result);
    } else {
      result = await client.getWords(dmAddress, length);
      console.log(`Nilai dari ${dmAddress} hingga ${dmAddress}+${length - 1}:`, result);
    }

    return result;
  } catch (error) {
    console.error("Gagal membaca PLC:", error);
  } finally {
    client.close();
  }
}

// Fungsi untuk menulis 1 word atau array
async function writePLC(ip, port, dmAddress, data) {
  const client = createClient(ip, port);

  try {
    await client.open();

    if (Array.isArray(data)) {
      await client.setWords(dmAddress, data);
      console.log(`Berhasil menulis array ke ${dmAddress}:`, data);
    } else {
      await client.setWord(dmAddress, data);
      console.log(`Berhasil menulis nilai ${data} ke ${dmAddress}`);
    }

    return true;
  } catch (error) {
    console.error("Gagal menulis ke PLC:", error);
    return false;
  } finally {
    client.close();
  }
}

async function readDoubleWords(ip, port, dmStart, count = 1, signed = false) {
  const client = createClient(ip, port);
  try {
    await client.open();

    const startAddr = parseInt(dmStart.replace(/[^\d]/g, ""), 10);
    const prefix = dmStart.replace(/\d+$/, ""); // misalnya "D"

    const totalWords = count * 2; // karena 1 double word = 2 word
    const allWords = await client.getWords(`${prefix}${startAddr}`, totalWords);

    if (!Array.isArray(allWords) || allWords.length !== totalWords) {
      throw new Error("Gagal membaca jumlah word yang diharapkan.");
    }

    const results = [];

    for (let i = 0; i < allWords.length; i += 2) {
      const low = (allWords[i] + 0x10000) & 0xFFFF;
      const high = (allWords[i + 1] + 0x10000) & 0xFFFF;

      let combined = (high << 16) | low;
      if (signed && combined >= 0x80000000) {
        combined = combined - 0x100000000;
      }

      // const currentAddr = startAddr + i;
      // console.log(`Double word dari ${prefix}${currentAddr} & ${prefix}${currentAddr + 1}:`, combined);

      results.push(combined);
    }

    return results;
  } catch (error) {
    console.error("Gagal membaca double words:", error);
    return [];
  } finally {
    client.close();
  }
}

setInterval(async () => {
  const data = await readDoubleWords("192.168.100.200", 5000, "D40016", 61);
  console.log(data)
}, 1000);
