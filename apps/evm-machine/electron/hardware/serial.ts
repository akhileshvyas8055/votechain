export class VVPATPrinterHardware {
  async printReceipt(vote: { electionId: string; candidateName: string; symbol: string; timestamp: string }) {
    console.log('PRINTING VVPAT SLIP:');
    console.log('====================================');
    console.log(`ELECTION: ${vote.electionId}`);
    console.log(`CANDIDATE: ${vote.candidateName}`);
    console.log(`SYMBOL: ${vote.symbol}`);
    console.log(`TIME: ${vote.timestamp}`);
    console.log('====================================');
    return true;
  }
}
