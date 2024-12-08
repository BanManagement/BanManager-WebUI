/* eslint-disable @next/next/no-img-element */
import { toHTML } from '@odiffey/discord-markdown'
import fillTemplate from 'es6-dynamic-template'
import Image from 'next/image'

export default function DiscordPreview ({ json, variables }) {
  if (!json) return null

  let content = json

  if (variables) {
    content = fillTemplate(json, variables)
  }

  try {
    content = JSON.parse(content)
  } catch (e) {
    return <div className='text-red-500'>Invalid JSON</div>
  }

  return (
    <div className='discord-preview shrink'>
      <div className='discord-message flex'>
        <div className='hidden sm:block w-fit shrink-0'>
          <Image className='rounded-full mr-3 h-10 w-10 cursor-pointer hover:shadow-lg active:translate-y-px bg-gray-600' src={(process.env.BASE_PATH || '') + '/images/banmanager-icon.png'} alt='BanManager' width='40' height='40' />
        </div>
        <div className='grow'>
          <p className='leading-none h-5'>
            <span className='hover:underline cursor-pointer underline-offset-1 decoration-1 font-medium text-[#f2f3f5] text-base'>BanManager</span>
            <span className='font-medium ml-1 cursor-default text-xs align-baseline text-[#949BA4]'>{new Date(content.timestamp || Date.now()).toLocaleString()}</span>
          </p>
          {content.content && <div className='discord-content' dangerouslySetInnerHTML={{ __html: toHTML(content.content) }} />}
          {content.embeds && (
            <div className='space-y-1 mt-1 flex flex-col'>{content.embeds.map((embed, index) => (
              <div key={index} className='discord-embed' style={{ borderColor: `#${embed.color.toString(16)}` }}>
                {embed.author && (
                  <div className='discord-embed-author'>
                    {embed.author.icon_url && <img src={embed.author.icon_url} alt='author icon' className='discord-embed-author-icon' />}
                    <span>{embed.author.name}</span>
                  </div>
                )}
                {embed.title && <div className='discord-embed-title'>{embed.title}</div>}
                {embed.description && <div className='discord-embed-description' dangerouslySetInnerHTML={{ __html: toHTML(embed.description) }} />}
                {embed.fields && embed.fields.map((field, idx) => (
                  <div key={idx} className='discord-embed-field'>
                    <div className='discord-embed-field-name'>{field.name}</div>
                    <div className='discord-embed-field-value' dangerouslySetInnerHTML={{ __html: toHTML(field.value) }} />
                  </div>
                ))}
                {embed.image && <img src={embed.image.url} alt='embed image' className='discord-embed-image' />}
                {embed.thumbnail && <div className='discord-embed-thumbnail' style={{ gridArea: '1 / 2 / 8 / 3' }}><img src={embed.thumbnail.url} alt='embed thumbnail' className='discord-embed-thumbnail-image' /></div>}
                {embed.footer && (
                  <div className='discord-embed-footer'>
                    {embed.footer.icon_url && <img src={embed.footer.icon_url} alt='footer icon' className='discord-embed-footer-icon' />}
                    <span>{embed.footer.text}</span>
                    {embed.timestamp && <span>{new Date(embed.timestamp).toLocaleString()}</span>}
                  </div>
                )}
              </div>))}
            </div>)}
          {content.components && content.components.map((component, index) => (
            <div key={index} className='discord-component'>
              {component.components && component.components.map((btn, idx) => (
                <a key={idx} href={btn.url} className='discord-button'>
                  <div className='m-auto'>{btn.label}</div>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
