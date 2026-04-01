import { test, expect } from '@playwright/test';
import { postMessageToThread } from 'node:worker_threads';

test.beforeAll(async ({ request }) => {
  await request.post('http://localhost:3000/test-start');
});

test.afterAll(async ({ request }) => {
  await request.post('http://localhost:3000/test-end');
});


async function enterRoom(page, username, password, reqcomp, reqrole){
  await page.goto('http://localhost:3000/');
  await page.getByRole('textbox', { name: 'ユーザー名' }).fill(username);
  await page.getByRole('textbox', { name: 'パスワード' }).fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.getByText('マルチモード').click();
  await page.getByRole('button', { name: '決定' }).click();
  await page.getByRole('link', { name: '買い物' }).click();
  await page.getByText(reqcomp).click();
  await page.getByText(reqrole).click();
  await page.getByRole('button', { name: '決定' }).click();
}

test('test', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();

  await enterRoom(pageA, '太郎', 'taropass', 'ひくい', 'ロール1');
  await enterRoom(pageB, '花子', 'hanakopass', 'たかい', 'ロール2');
  await enterRoom(pageC, '二郎', 'jiropass', 'たかい', 'ロール2');
  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋に参加').click();
  await pageA.getByRole('button', { name: '入室' }).click();
  //await Promise.all([
    pageB.getByRole('button', { name: '入室' }).click()
    pageC.getByRole('button', { name: '入室' }).click()
  //]);

  await pageA.waitForTimeout(10000);
  //await contextA.close();
  await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();

});

test('dialogue test', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();

  await enterRoom(pageA, '太郎', 'taropass', 'ひくい', 'ロール1');
  await enterRoom(pageB, '花子', 'hanakopass', 'ひくい', 'ロール2');
  await enterRoom(pageC, '二郎', 'jiropass', 'たかい', 'ロール2');
  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋に参加').click();
  await pageA.getByRole('button', { name: '入室' }).click();
  
  pageB.getByRole('button', { name: '入室' }).click()
  
  pageC.getByRole('button', { name: '入室' }).click()
  

  await pageA.waitForTimeout(20000);
  //await contextA.close();
  //await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();

});

test('ng test', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();

  await enterRoom(pageA, '太郎', 'taropass', 'ひくい', 'ロール1');
  await enterRoom(pageB, '花子', 'hanakopass', 'ひくい', 'ロール2');
  await enterRoom(pageC, '二郎', 'jiropass', 'ひくい', 'ロール2');
  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋に参加').click();
  await pageA.getByRole('button', { name: '入室' }).click();
  //await Promise.all([
    pageB.getByRole('button', { name: '入室' }).click()
    pageC.getByRole('button', { name: '入室' }).click()
  //]);

  await pageA.waitForTimeout(20000);
  //await contextA.close();
  await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});

test('first test', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  const contextE = await browser.newContext();
  const pageE = await contextE.newPage();
  const contextF = await browser.newContext();
  const pageF = await contextF.newPage();

  await enterRoom(pageA, 'test_1', 'test_1', 'ひくい', 'ロール1');
  await enterRoom(pageB, 'test_2', 'test_2', 'ひくい', 'ロール2');
  await enterRoom(pageC, 'test_3', 'test_3', 'ひくい', 'ロール1');
  await enterRoom(pageD, 'test_4', 'test_4', 'ひくい', 'ロール2');
  await enterRoom(pageE, 'test_5', 'test_5', 'ひくい', 'ロール1');
  await enterRoom(pageF, 'test_6', 'test_6', 'ひくい', 'ロール2');

  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋を作る').click();
  await pageD.getByText('部屋に参加').click();
  await pageE.getByText('部屋を作る').click();
  await pageF.getByText('部屋に参加').click();
  
  await pageA.getByRole('button', { name: '入室' }).click();
  await pageC.getByRole('button', { name: '入室' }).click();
  await pageE.getByRole('button', { name: '入室' }).click();
  //await Promise.all([
    pageB.getByRole('button', { name: '入室' }).click()
    pageE.getByRole('button', { name: '入室' }).click()
    pageF.getByRole('button', { name: '入室' }).click();
  //]);

  await pageA.waitForTimeout(20000);
  //await contextA.close();
  await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});

test('second test', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  const contextE = await browser.newContext();
  const pageE = await contextE.newPage();
  const contextF = await browser.newContext();
  const pageF = await contextF.newPage();

  await enterRoom(pageA, 'test_1', 'test_1', 'ひくい', 'ロール1');
  await enterRoom(pageB, 'test_2', 'test_2', 'ひくい', 'ロール2');
  await enterRoom(pageC, 'test_3', 'test_3', 'ひくい', 'ロール1');
  await enterRoom(pageD, 'test_4', 'test_4', 'ひくい', 'ロール2');
  await enterRoom(pageE, 'test_5', 'test_5', 'ひくい', 'ロール1');
  await enterRoom(pageF, 'test_6', 'test_6', 'ひくい', 'ロール2');

  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋に参加').click();
  await pageD.getByText('部屋を作る').click();
  await pageE.getByText('部屋に参加').click();
  await pageF.getByText('部屋に参加').click();
  
  await pageA.getByRole('button', { name: '入室' }).click();
  await pageD.getByRole('button', { name: '入室' }).click();
  
  //await Promise.all([
    pageB.getByRole('button', { name: '入室' }).click();
    pageC.getByRole('button', { name: '入室' }).click()
    pageE.getByRole('button', { name: '入室' }).click()
    pageF.getByRole('button', { name: '入室' }).click();
  //]);

  await pageA.waitForTimeout(30000);
  //await contextA.close();
  await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});

test('test3', async ({ browser }) => {
  test.setTimeout(10 * 60 * 1000);
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  const contextE = await browser.newContext();
  const pageE = await contextE.newPage();
  const contextF = await browser.newContext();
  const pageF = await contextF.newPage();

  await enterRoom(pageA, 'test_1', 'test_1', 'ひくい', 'ロール1');
  await enterRoom(pageB, 'test_2', 'test_2', 'ひくい', 'ロール2');
  await enterRoom(pageC, 'test_3', 'test_3', 'ひくい', 'ロール1');
  await enterRoom(pageD, 'test_4', 'test_4', 'ひくい', 'ロール2');
  await enterRoom(pageE, 'test_5', 'test_5', 'ひくい', 'ロール1');
  await enterRoom(pageF, 'test_6', 'test_6', 'ひくい', 'ロール2');

  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋を作る').click();
  await pageD.getByText('部屋に参加').click();
  await pageE.getByText('部屋を作る').click();
  await pageF.getByText('部屋に参加').click();
  
  await pageA.getByRole('button', { name: '入室' }).click();
  await pageD.getByRole('button', { name: '入室' }).click();
  
  //await Promise.all([
    pageB.getByRole('button', { name: '入室' }).click();
    pageA.getByRole('button', { name: '入室' }).click();
    pageD.getByRole('button', { name: '入室' }).click();
    pageC.getByRole('button', { name: '入室' }).click()
    pageE.getByRole('button', { name: '入室' }).click()
    pageF.getByRole('button', { name: '入室' }).click();
  //]);

  await new Promise(() => {});
  //await contextA.close();
  //await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});

test('test4', async ({ browser }) => {
  test.setTimeout(10 * 60 * 1000);
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  const contextE = await browser.newContext();
  const pageE = await contextE.newPage();
  const contextF = await browser.newContext();
  const pageF = await contextF.newPage();

  await enterRoom(pageA, 'test_1', 'test_1', 'たかい', 'ロール2');
  await enterRoom(pageB, 'test_2', 'test_2', 'たかい', 'ロール2');
  await enterRoom(pageC, 'test_3', 'test_3', 'たかい', 'ロール2');
  await enterRoom(pageD, 'test_4', 'test_4', 'たかい', 'ロール1');
  await enterRoom(pageE, 'test_5', 'test_5', 'たかい', 'ロール1');
  await enterRoom(pageF, 'test_6', 'test_6', 'たかい', 'ロール1');

  await pageA.getByText('部屋に参加').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋に参加').click();
  await pageD.getByText('部屋を作る').click();
  await pageE.getByText('部屋を作る').click();
  await pageF.getByText('部屋を作る').click();
  
  await pageD.getByRole('button', { name: '入室' }).click();
  await pageE.getByRole('button', { name: '入室' }).click();
  await pageF.getByRole('button', { name: '入室' }).click();
  //await Promise.all([
    pageA.getByRole('button', { name: '入室' }).click();
    pageB.getByRole('button', { name: '入室' }).click();
    pageC.getByRole('button', { name: '入室' }).click();
  //]);

  await pageA.waitForTimeout(60000);
  //await contextA.close();
  //await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});

test.only('test5', async ({ browser }) => {
  test.setTimeout(10 * 60 * 1000);
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  const contextE = await browser.newContext();
  const pageE = await contextE.newPage();
  const contextF = await browser.newContext();
  const pageF = await contextF.newPage();

  await enterRoom(pageA, 'test_1', 'test_1', 'ひくい', 'ロール2');
  await enterRoom(pageB, 'test_2', 'test_2', 'ひくい', 'ロール2');
  await enterRoom(pageC, 'test_3', 'test_3', 'たかい', 'ロール1');
  await enterRoom(pageD, 'test_4', 'test_4', 'たかい', 'ロール1');
  await enterRoom(pageE, 'test_5', 'test_5', 'ひくい', 'ロール1');
  await enterRoom(pageF, 'test_6', 'test_6', 'ひくい', 'ロール1');

  await pageA.getByText('部屋を作る').click();
  await pageB.getByText('部屋を作る').click();
  await pageC.getByText('部屋に参加').click();
  await pageD.getByText('部屋に参加').click();
  await pageE.getByText('部屋に参加').click();
  await pageF.getByText('部屋に参加').click();
  
  await pageA.getByRole('button', { name: '入室' }).click();
  await pageB.getByRole('button', { name: '入室' }).click();
  //await Promise.all([
    pageC.getByRole('button', { name: '入室' }).click();
    pageD.getByRole('button', { name: '入室' }).click();
    //pageC.getByRole('button', { name: '入室' }).click();
  //]);

  await pageA.waitForTimeout(120000);
  //await contextA.close();
  //await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});

test('test6', async ({ browser }) => {
  test.setTimeout(10 * 60 * 1000);
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const contextC = await browser.newContext();
  const pageC = await contextC.newPage();
  const contextD = await browser.newContext();
  const pageD = await contextD.newPage();
  const contextE = await browser.newContext();
  const pageE = await contextE.newPage();
  const contextF = await browser.newContext();
  const pageF = await contextF.newPage();

  await enterRoom(pageA, 'test_1', 'test_1', 'ひくい', 'ロール2');
  await enterRoom(pageB, 'test_2', 'test_2', 'ひくい', 'ロール2');
  await enterRoom(pageC, 'test_3', 'test_3', 'ひくい', 'ロール2');
  await enterRoom(pageD, 'test_4', 'test_4', 'ひくい', 'ロール1');
  await enterRoom(pageE, 'test_5', 'test_5', 'ひくい', 'ロール1');
  await enterRoom(pageF, 'test_6', 'test_6', 'ひくい', 'ロール1');

  await pageA.getByText('部屋に参加').click();
  await pageB.getByText('部屋に参加').click();
  await pageC.getByText('部屋に参加').click();
  await pageD.getByText('部屋を作る').click();
  await pageE.getByText('部屋を作る').click();
  await pageF.getByText('部屋を作る').click();
  
  await pageD.getByRole('button', { name: '入室' }).click();
  await pageE.getByRole('button', { name: '入室' }).click();
  await pageF.getByRole('button', { name: '入室' }).click();
  //await Promise.all([
    pageA.getByRole('button', { name: '入室' }).click();
    pageB.getByRole('button', { name: '入室' }).click();
    pageC.getByRole('button', { name: '入室' }).click();
  //]);

  await pageA.waitForTimeout(60000);
  //await contextA.close();
  //await pageA.getByRole('link', { name: 'がくしゅうをおわる' }).click();
});