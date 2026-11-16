import { AsciiTable3, AlignmentEnum } from 'ascii-table3'

const table = new AsciiTable3('User Directory')
  .setStyle('unicode-single')
  .setHeading('Name', 'Age', 'Role')
  .setAlign(2, AlignmentEnum.CENTER)
  .addRowMatrix([
    ['Alice', 29, 'Engineer'],
    ['Bob', 34, 'Designer'],
    ['Charlie', 41, 'Manager']
  ]);

console.log(table.toString())
