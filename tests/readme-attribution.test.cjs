const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('README channel rendering preserves destinations, campaign, content, template and fragment',async()=>{
  const {retagReadme}=await import('../scripts/prepare-npm-readme.mjs');
  const original='[Try](https://wafly.com.br/signup?utm_source=github&utm_medium=repository&utm_campaign=old_campaign&utm_content=exact_content&template_id=08#setup)\nhttps://wafly.com.br/api-bridge-whats/instances/INSTANCE/token/TOKEN/send-text\nhttps://github.com/iagovelasco3/n8n-nodes-wafly\n';
  const npm=retagReadme(original,'npm','community_node');
  assert.equal(npm,original.replace('utm_source=github','utm_source=npm').replace('utm_medium=repository','utm_medium=community_node'));
  assert.equal(retagReadme(npm,'github','repository'),original);
  assert.equal(retagReadme(npm,'npm','community_node'),npm);
});

test('all tracked Wafly links render into the target channel without changing other content',async()=>{
  const {retagReadme}=await import('../scripts/prepare-npm-readme.mjs');
  const original=fs.readFileSync(path.join(__dirname,'../README.md'),'utf8');
  for(const [source,medium]of [['github','repository'],['npm','community_node']]){
    const rendered=retagReadme(original,source,medium);
    const urls=[...rendered.matchAll(/https:\/\/(?:www\.)?wafly\.(?:com\.br|io)\/[^\s<>)\]]*/g)].map(m=>new URL(m[0])).filter(u=>u.searchParams.has('utm_source'));
    assert(urls.length>=10);
    for(const url of urls){assert.equal(url.searchParams.get('utm_source'),source);assert.equal(url.searchParams.get('utm_medium'),medium);}
    assert.equal(retagReadme(rendered,'github','repository'),retagReadme(original,'github','repository'));
  }
});

test('CI rendering writes only the isolated README and refuses accidental local execution',()=>{
  const os=require('node:os');const {spawnSync}=require('node:child_process');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wafly-readme-'));
  const script=path.join(__dirname,'../scripts/prepare-npm-readme.mjs');
  const original='[Try](https://wafly.com.br/signup?utm_source=github&utm_medium=repository&utm_campaign=fixed#setup)';
  try {
    fs.writeFileSync(path.join(dir,'README.md'),original);
    let out=spawnSync(process.execPath,[script,'--write'],{cwd:dir,env:{...process.env,GITHUB_ACTIONS:'false'}});
    assert.notEqual(out.status,0);assert.equal(fs.readFileSync(path.join(dir,'README.md'),'utf8'),original);
    out=spawnSync(process.execPath,[script,'--write'],{cwd:dir,env:{...process.env,GITHUB_ACTIONS:'true'}});
    assert.equal(out.status,0,out.stderr.toString());
    assert.equal(fs.readFileSync(path.join(dir,'README.md'),'utf8'),original.replace('utm_source=github','utm_source=npm').replace('utm_medium=repository','utm_medium=community_node'));
    assert.deepEqual(fs.readdirSync(dir),['README.md']);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
